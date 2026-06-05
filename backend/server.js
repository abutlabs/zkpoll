// zkpoll backend: the relayer + read API. Network-aware.
//
// Role (important): the chain is the database. This backend does NOT store votes and CANNOT
// forge them. It only (1) relays the on-chain vote tx, paying gas so users need no crypto,
// and (2) reads the live tally for the frontend.
//
//   NETWORK=local   -> NLPoll on the local Moonbeam/Moonriver dev node, MOCK verifier.
//                      Dev "simulate citizen": POST /api/vote { choice, nullifier, nationality }.
//   NETWORK=sepolia -> NLPollZK on Ethereum Sepolia, REAL zkPassport verifier.
//                      The frontend's zkPassport SDK produces `params`; POST /api/vote-zk
//                      { params, scope } and we relay NLPollZK.vote(params, scope).

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
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const NETWORK = process.env.NETWORK || "local";

// Minimal .env loader (sepolia needs RELAYER_KEY + SEPOLIA_RPC_URL from the repo-root .env).
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(root, ".env"));

const KNOWN_ERRORS = [
  "AlreadyVoted", "NotDutchCitizen", "WrongPoll", "WrongChain", "ProofInvalid",
  "InvalidScope", "InvalidChoice", "PollDoesNotExist",
];
const ERROR_ABI = KNOWN_ERRORS.map((name) => ({ type: "error", name, inputs: [] }));

// ---- Network configuration -------------------------------------------------
let cfg;
if (NETWORK === "sepolia") {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "deployments.sepolia.json"), "utf8"));
  const key = process.env.RELAYER_KEY;
  if (!key) throw new Error("RELAYER_KEY missing (set it in .env)");
  cfg = {
    manifest,
    chain: sepolia,
    rpc: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    key,
    address: manifest.nlPollZK,
    abi: [
      { type: "function", name: "results", stateMutability: "view",
        inputs: [{ name: "scope", type: "string" }], outputs: [{ type: "uint256[]" }] },
      { type: "function", name: "vote", stateMutability: "nonpayable", inputs: [
          { name: "params", type: "tuple", components: [
            { name: "version", type: "bytes32" },
            { name: "proofVerificationData", type: "tuple", components: [
              { name: "vkeyHash", type: "bytes32" }, { name: "proof", type: "bytes" },
              { name: "publicInputs", type: "bytes32[]" } ] },
            { name: "committedInputs", type: "bytes" },
            { name: "serviceConfig", type: "tuple", components: [
              { name: "validityPeriodInSeconds", type: "uint256" }, { name: "domain", type: "string" },
              { name: "scope", type: "string" }, { name: "devMode", type: "bool" } ] },
          ] },
          { name: "scope", type: "string" },
        ], outputs: [] },
      ...ERROR_ABI,
    ],
    pollKey: manifest.scope,
  };
} else {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "deployments.local.json"), "utf8"));
  cfg = {
    manifest,
    chain: defineChain({ id: manifest.chainId, name: "Moonbeam Dev (local)",
      nativeCurrency: { name: "DEV", symbol: "DEV", decimals: 18 },
      rpcUrls: { default: { http: [manifest.rpc] } } }),
    rpc: manifest.rpc,
    // Well-known PUBLIC Moonbeam dev account "Gerald" — local dev only, pre-funded.
    key: "0x99b3c12287537e38c90a9219d4cb074a89a16e9cdb20bf85728ebd97c343e342",
    address: manifest.nlPoll,
    abi: [
      { type: "function", name: "results", stateMutability: "view",
        inputs: [{ name: "pollId", type: "bytes32" }], outputs: [{ type: "uint256[]" }] },
      { type: "function", name: "vote", stateMutability: "nonpayable", inputs: [
          { name: "pollId", type: "bytes32" }, { name: "choice", type: "uint8" },
          { name: "proof", type: "bytes" }, { name: "publicInputs", type: "bytes" } ], outputs: [] },
      ...ERROR_ABI,
    ],
    pollKey: manifest.pollId,
  };
}

const account = privateKeyToAccount(cfg.key);
const publicClient = createPublicClient({ chain: cfg.chain, transport: http(cfg.rpc) });
const walletClient = createWalletClient({ account, chain: cfg.chain, transport: http(cfg.rpc) });
const contract = { address: cfg.address, abi: cfg.abi };

function decodeError(e) {
  if (e instanceof BaseError) {
    const reverted = e.walk((err) => err instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      return reverted.data?.errorName ?? reverted.signature ?? String(e.shortMessage);
    }
  }
  return String(e.shortMessage || e.message);
}

async function readTally() {
  return publicClient.readContract({ ...contract, functionName: "results", args: [cfg.pollKey] });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" })); // proofs can be sizeable

// --- the daily poll + live tally ---
app.get("/api/poll", async (_req, res) => {
  try {
    const counts = await readTally();
    res.json({
      network: NETWORK,
      mode: NETWORK === "sepolia" ? "zkpassport" : "mock",
      question: cfg.manifest.question,
      choices: ["No", "Yes"],
      tally: counts.map((c) => Number(c)),
      total: counts.reduce((a, c) => a + Number(c), 0),
      contract: cfg.address,
      chainId: cfg.manifest.chainId,
      scope: cfg.manifest.scope || cfg.manifest.pollId, // SDK `scope` for the real flow
      domain: cfg.manifest.domain || "localhost",
      chainName: NETWORK === "sepolia" ? "ethereum_sepolia" : "local",
    });
  } catch (e) {
    res.status(500).json({ error: decodeError(e) });
  }
});

// --- REAL flow: relay zkPassport params to NLPollZK on Sepolia ---
app.post("/api/vote-zk", async (req, res) => {
  if (NETWORK !== "sepolia") return res.status(400).json({ error: "vote-zk requires NETWORK=sepolia" });
  try {
    const { params, scope } = req.body;
    if (!params || !scope) return res.status(400).json({ error: "params and scope required" });
    await publicClient.simulateContract({ ...contract, functionName: "vote", args: [params, scope], account });
    const hash = await walletClient.writeContract({ ...contract, functionName: "vote", args: [params, scope] });
    await publicClient.waitForTransactionReceipt({ hash });
    res.json({ ok: true, txHash: hash, explorer: `https://sepolia.etherscan.io/tx/${hash}` });
  } catch (e) {
    res.status(400).json({ ok: false, error: decodeError(e) });
  }
});

// --- DEV flow: simulated citizen on the local mock node ---
app.post("/api/vote", async (req, res) => {
  if (NETWORK !== "local") return res.status(400).json({ error: "use /api/vote-zk on sepolia" });
  try {
    const { choice } = req.body;
    if (choice !== 0 && choice !== 1) return res.status(400).json({ error: "choice must be 0 or 1" });
    const nationality = (req.body.nationality || "NLD").toUpperCase();
    const nullifier = BigInt(req.body.nullifier ?? Math.floor(Math.random() * 1e15));
    const nat3 = padHex(stringToHex(nationality), { size: 3, dir: "right" });
    const publicInputs = encodeAbiParameters(
      parseAbiParameters("bool, uint256, bytes3, bytes32"),
      [true, nullifier, nat3, cfg.pollKey]
    );
    await publicClient.simulateContract({
      ...contract, functionName: "vote", args: [cfg.pollKey, choice, "0x", publicInputs], account });
    const hash = await walletClient.writeContract({
      ...contract, functionName: "vote", args: [cfg.pollKey, choice, "0x", publicInputs] });
    await publicClient.waitForTransactionReceipt({ hash });
    res.json({ ok: true, txHash: hash, nullifier: toHex(nullifier) });
  } catch (e) {
    res.status(400).json({ ok: false, error: decodeError(e) });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`zkpoll backend [${NETWORK}] on http://localhost:${PORT}`);
  console.log(`  relayer  ${account.address}`);
  console.log(`  contract ${cfg.address}  @ ${cfg.rpc}`);
});
