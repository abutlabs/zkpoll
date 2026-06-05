import React, { useEffect, useState, useCallback } from "react";

// Generate a random "citizen" = a unique nullifier. In production this comes from a real
// zkPassport proof (one nullifier per real passport, per poll). Here a fresh random value
// models a new citizen; reusing one models the same person trying to vote twice.
const newCitizen = () => Math.floor(Math.random() * 1e15);

export default function App() {
  const [poll, setPoll] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null);
  // The current simulated voter's identity (their nullifier). Persisted so you can try
  // voting twice as "the same citizen".
  const [citizen, setCitizen] = useState(newCitizen);
  const [nationality, setNationality] = useState("NLD");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/poll");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setPoll(j);
      setErr(null);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 2500); // live tally
    return () => clearInterval(t);
  }, [load]);

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
          WrongPoll: "Proof was bound to a different poll.",
        }[j.error] || j.error;
        setFlash({ kind: "err", msg: human });
      } else {
        setFlash({ kind: "ok", msg: `Vote recorded on-chain · tx ${j.txHash.slice(0, 10)}…` });
        await load();
      }
    } catch (e) {
      setFlash({ kind: "err", msg: String(e.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const total = poll?.total ?? 0;
  const pct = (i) => (total === 0 ? 0 : Math.round((100 * poll.tally[i]) / total));

  return (
    <div className="wrap">
      <header>
        <span className="flag">🇳🇱</span>
        <div>
          <h1>zkpoll</h1>
          <p className="sub">One question a day · verified Dutch citizens only · counted on-chain</p>
        </div>
      </header>

      {err && <div className="banner err">Backend unreachable: {err}</div>}

      {poll && (
        <main>
          <div className="card">
            <h2>{poll.question}</h2>

            <div className="bars">
              {poll.choices.map((label, i) => (
                <div className="bar-row" key={i}>
                  <div className="bar-label">
                    <span>{label}</span>
                    <span className="count">{poll.tally[i]} · {pct(i)}%</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill c${i}`} style={{ width: `${pct(i)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="actions">
              <button disabled={busy} className="vote no" onClick={() => vote(0)}>Vote No</button>
              <button disabled={busy} className="vote yes" onClick={() => vote(1)}>Vote Yes</button>
            </div>

            {flash && <div className={`flash ${flash.kind}`}>{flash.msg}</div>}

            <p className="total">{total} verified vote{total === 1 ? "" : "s"} so far</p>
          </div>

          <div className="dev">
            <div className="dev-title">Dev panel · simulate the zkPassport scan</div>
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

          <footer>
            <span>contract {poll.contract.slice(0, 8)}… · chain {poll.chainId}</span>
          </footer>
        </main>
      )}
    </div>
  );
}
