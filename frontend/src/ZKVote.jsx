import React, { useState, useMemo } from "react";
import { ZKPassportQRCode } from "@zkpassport/ui/react";
import { ZKPassport } from "@zkpassport/sdk";
import "@zkpassport/ui/styles.css";

// REAL flow: scan a Dutch passport/ID with the zkPassport app, verify on-chain on Sepolia.
//
// The vote choice must be BOUND into the proof (custom_data) so the relayer can't tamper.
// So the user picks Yes/No FIRST, then scans; the QR encodes a request that binds that choice.
export default function ZKVote({ poll, onVoted }) {
  const [choice, setChoice] = useState(null); // 0 = No, 1 = Yes
  const [devMode, setDevMode] = useState(false); // mock passports (testing only)
  const [status, setStatus] = useState(null);
  const [flash, setFlash] = useState(null);

  // A standalone SDK instance, only used to format the proof into verifier params.
  const sdk = useMemo(() => new ZKPassport(poll.domain), [poll.domain]);

  async function handleResult({ verified, result, proofs }) {
    if (!verified) {
      setFlash({ kind: "err", msg: "Proof did not verify." });
      return;
    }
    try {
      setStatus("Submitting your verified vote on-chain…");
      const evmProof = proofs.find((p) => p.name?.startsWith("outer_evm"));
      if (!evmProof) throw new Error("No EVM proof in result (need mode=compressed-evm).");

      const params = sdk.getSolidityVerifierParameters({
        proof: evmProof,
        scope: poll.scope,
        devMode,
      });

      const r = await fetch("/api/vote-zk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ params, scope: poll.scope }),
      });
      const j = await r.json();
      if (!j.ok) {
        const human = {
          AlreadyVoted: "You already voted on this poll.",
          NotDutchCitizen: "This document is not a Dutch (🇳🇱) citizenship.",
          WrongChain: "Proof was bound to the wrong chain.",
          InvalidScope: "Proof was for a different poll.",
        }[j.error] || j.error;
        setFlash({ kind: "err", msg: human });
        setStatus(null);
      } else {
        setFlash({ kind: "ok", msg: "Vote recorded on-chain ✓" });
        setStatus(null);
        setChoice(null);
        onVoted();
      }
    } catch (e) {
      setFlash({ kind: "err", msg: String(e.message || e) });
      setStatus(null);
    }
  }

  // Build the query: prove Dutch citizenship (without disclosing), bind chain + the choice.
  const query = (qb) =>
    qb
      .in("nationality", ["NLD"])
      .bind("chain", poll.chainName) // "ethereum_sepolia" -> chainId 11155111
      .bind("custom_data", String(choice))
      .done();

  if (choice === null) {
    return (
      <>
        <p className="zk-lead">Pick your answer, then scan your Dutch passport or ID to vote.</p>
        <div className="actions">
          <button className="vote no" onClick={() => setChoice(0)}>Vote No</button>
          <button className="vote yes" onClick={() => setChoice(1)}>Vote Yes</button>
        </div>
        {flash && <div className={`flash ${flash.kind}`}>{flash.msg}</div>}
        <label className="dev-toggle">
          <input type="checkbox" checked={devMode} onChange={(e) => setDevMode(e.target.checked)} />
          dev mode (mock passports — testing)
        </label>
      </>
    );
  }

  return (
    <div className="zk-scan">
      <div className="zk-choice-pill">
        You are voting <b>{poll.choices[choice]}</b>
        <button className="ghost" onClick={() => { setChoice(null); setFlash(null); setStatus(null); }}>
          change
        </button>
      </div>

      <ZKPassportQRCode
        name="Daily Citizen Poll"
        purpose={`Vote "${poll.choices[choice]}" on: ${poll.question}`}
        scope={poll.scope}
        mode="compressed-evm"
        query={query}
        onResult={handleResult}
        onReject={() => setFlash({ kind: "err", msg: "Request rejected on your phone." })}
        onError={(e) => setFlash({ kind: "err", msg: String(e?.message || e) })}
        theme="dark"
      />

      {status && <div className="flash ok">{status}</div>}
      {flash && <div className={`flash ${flash.kind}`}>{flash.msg}</div>}
    </div>
  );
}
