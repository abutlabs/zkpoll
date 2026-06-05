// zkpoll backend: the relayer + read API.
//
// Role (important): the chain is the database. This backend does NOT store votes and
// CANNOT forge them. It only (1) relays the on-chain vote() tx, paying gas so users need
// no crypto, and (2) reads the live tally from the contract for the frontend.
//
// DEV MODE: we don't have real zkPassport proofs locally, so POST /api/vote accepts a
// simulated voter { choice, nullifier, nationality } and builds the public signals the
// real verifier would surface. In production this endpoint instead receives { proof,
// publicInputs } from the zkPassport SDK and passes them straight to the contract — the
// rest of the flow is identical. The swap-in point is marked SDK-SEAM below.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import {
  createPublicClient, createWalletClient, http, defineChain,
  encodeAbiParameters, parseAbiParameters, stringToHex, padHex, toHex,
  BaseError, ContractFunctionRevertedError,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "deployments.local.json"), "utf8")
);

// Well-known PUBLIC Moonbeam dev account "Gerald" — LOCAL DEV ONLY, pre-funded.
const RELAYER_KEY =
  process.env.RELAYER_KEY ||
  "0x99b3c12287537e38c90a9219d4cb074a89a16e9cdb20bf85728ebd97c343e342";

const moonbeamDev = defineChain({
  id: manifest.chainId,
  name: "Moonbeam Dev (local)",
  nativeCurrency: { name: "DEV", symbol: "DEV", decimals: 18 },
  rpcUrls: { default: { http: [manifest.rpc] } },
});

const account = privateKeyToAccount(RELAYER_KEY);
const publicClient = createPublicClient({ chain: moonbeamDev, transport: http(manifest.rpc) });
const walletClient = createWalletClient({ account, chain: moonbeamDev, transport: http(manifest.rpc) });

const NLPOLL_ABI = [
  { type: "function", name: "vote", stateMutability: "nonpayable",
    inputs: [
      { name: "pollId", type: "bytes32" }, { name: "choice", type: "uint8" },
      { name: "proof", type: "bytes" }, { name: "publicInputs", type: "bytes" },
    ], outputs: [] },
  { type: "function", name: "results", stateMutability: "view",
    inputs: [{ name: "pollId", type: "bytes32" }], outputs: [{ type: "uint256[]" }] },
  { type: "function", name: "polls", stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "id", type: "bytes32" }, { name: "question", type: "string" },
      { name: "numChoices", type: "uint8" }, { name: "exists", type: "bool" },
    ] },
  { type: "function", name: "hasVoted", stateMutability: "view",
    inputs: [{ name: "pollId", type: "bytes32" }, { name: "nullifier", type: "uint256" }],
    outputs: [{ type: "bool" }] },
  // Custom errors — so viem decodes reverts to readable names (e.g. AlreadyVoted).
  { type: "error", name: "AlreadyVoted", inputs: [] },
  { type: "error", name: "NotDutchCitizen", inputs: [] },
  { type: "error", name: "WrongPoll", inputs: [] },
  { type: "error", name: "ProofInvalid", inputs: [] },
  { type: "error", name: "InvalidChoice", inputs: [] },
  { type: "error", name: "PollDoesNotExist", inputs: [] },
];
const nlPoll = { address: manifest.nlPoll, abi: NLPOLL_ABI };

const app = express();
app.use(cors());
app.use(express.json());

// --- the daily poll + live tally (read straight from chain) ---
app.get("/api/poll", async (_req, res) => {
  try {
    const [counts] = await Promise.all([
      publicClient.readContract({ ...nlPoll, functionName: "results", args: [manifest.pollId] }),
    ]);
    res.json({
      pollId: manifest.pollId,
      question: manifest.question,
      choices: ["No", "Yes"],
      tally: counts.map((c) => Number(c)),
      total: counts.reduce((a, c) => a + Number(c), 0),
      contract: manifest.nlPoll,
      chainId: manifest.chainId,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.shortMessage || e.message) });
  }
});

// --- cast a vote (relayer pays gas) ---
app.post("/api/vote", async (req, res) => {
  try {
    const { choice } = req.body;
    if (choice !== 0 && choice !== 1) return res.status(400).json({ error: "choice must be 0 or 1" });

    // SDK-SEAM ------------------------------------------------------------------
    // Production: const { proof, publicInputs } = req.body  (from the zkPassport SDK)
    // Dev: synthesize the signals a valid Dutch proof would produce.
    const nationality = (req.body.nationality || "NLD").toUpperCase();
    // Each simulated "citizen" is a distinct nullifier; reuse one to test double-voting.
    const nullifier = BigInt(req.body.nullifier ?? Math.floor(Math.random() * 1e15));
    const nat3 = padHex(stringToHex(nationality), { size: 3, dir: "right" });
    const publicInputs = encodeAbiParameters(
      parseAbiParameters("bool, uint256, bytes3, bytes32"),
      [true, nullifier, nat3, manifest.pollId]
    );
    const proof = "0x"; // mock: empty; real proof bytes go here
    // ---------------------------------------------------------------------------

    // Simulate first so we can return a clean error (e.g. AlreadyVoted) instead of a raw revert.
    await publicClient.simulateContract({
      ...nlPoll, functionName: "vote", args: [manifest.pollId, choice, proof, publicInputs], account,
    });
    const hash = await walletClient.writeContract({
      ...nlPoll, functionName: "vote", args: [manifest.pollId, choice, proof, publicInputs],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    res.json({ ok: true, txHash: hash, nullifier: toHex(nullifier) });
  } catch (e) {
    let error = String(e.shortMessage || e.message);
    if (e instanceof BaseError) {
      const reverted = e.walk((err) => err instanceof ContractFunctionRevertedError);
      if (reverted instanceof ContractFunctionRevertedError) {
        error = reverted.data?.errorName ?? reverted.signature ?? error;
      }
    }
    res.status(400).json({ ok: false, error });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`zkpoll backend on http://localhost:${PORT}`);
  console.log(`  relayer ${account.address}`);
  console.log(`  NLPoll  ${manifest.nlPoll}  @ ${manifest.rpc}`);
});
