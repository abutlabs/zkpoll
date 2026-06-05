import React, { useState } from "react";

// LOCAL dev flow: simulate the zkPassport scan against the mock verifier on the local node.
const newCitizen = () => Math.floor(Math.random() * 1e15);

export default function MockVote({ poll, onVoted }) {
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null);
  const [citizen, setCitizen] = useState(newCitizen);
  const [nationality, setNationality] = useState("NLD");

  const vote = async (choice) => {
    setBusy(true);
    setFlash(null);
    try {
      const r = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ choice, nullifier: citizen, nationality }),
      });
      const j = await r.json();
      if (!j.ok) {
        const human = {
          AlreadyVoted: "This citizen already voted on this poll.",
          NotDutchCitizen: "Only Dutch citizens (🇳🇱 NLD) may vote.",
        }[j.error] || j.error;
        setFlash({ kind: "err", msg: human });
      } else {
        setFlash({ kind: "ok", msg: `Vote recorded on-chain · tx ${j.txHash.slice(0, 10)}…` });
        onVoted();
      }
    } catch (e) {
      setFlash({ kind: "err", msg: String(e.message || e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="actions">
        <button disabled={busy} className="vote no" onClick={() => vote(0)}>Vote No</button>
        <button disabled={busy} className="vote yes" onClick={() => vote(1)}>Vote Yes</button>
      </div>
      {flash && <div className={`flash ${flash.kind}`}>{flash.msg}</div>}

      <div className="dev">
        <div className="dev-title">Dev panel · simulate the zkPassport scan (local mock)</div>
        <p className="dev-note">
          No real passport locally — this stands in for a zkPassport proof. Each citizen is a
          unique nullifier; reuse one to see the on-chain double-vote rejection.
        </p>
        <div className="dev-row">
          <label>Citizen (nullifier)</label>
          <code>{citizen}</code>
          <button className="ghost" onClick={() => setCitizen(newCitizen())}>New citizen</button>
        </div>
        <div className="dev-row">
          <label>Nationality</label>
          <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
            <option value="NLD">🇳🇱 NLD (eligible)</option>
            <option value="DEU">🇩🇪 DEU (rejected)</option>
            <option value="FRA">🇫🇷 FRA (rejected)</option>
          </select>
        </div>
      </div>
    </>
  );
}
