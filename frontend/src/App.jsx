import React, { useEffect, useState, useCallback } from "react";
import MockVote from "./MockVote.jsx";
import ZKVote from "./ZKVote.jsx";

export default function App() {
  const [poll, setPoll] = useState(null);
  const [err, setErr] = useState(null);

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
    const t = setInterval(load, 3000); // live tally
    return () => clearInterval(t);
  }, [load]);

  const total = poll?.total ?? 0;
  const pct = (i) => (total === 0 ? 0 : Math.round((100 * poll.tally[i]) / total));
  const isReal = poll?.mode === "zkpassport";

  return (
    <div className="wrap">
      <header>
        <span className="flag">🇳🇱</span>
        <div>
          <h1>zkpoll</h1>
          <p className="sub">One question a day · verified Dutch citizens only · counted on-chain</p>
        </div>
        {poll && (
          <span className={`net ${isReal ? "live" : "dev"}`}>
            {isReal ? "Sepolia · real zkPassport" : "local · mock"}
          </span>
        )}
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

            {isReal
              ? <ZKVote poll={poll} onVoted={load} />
              : <MockVote poll={poll} onVoted={load} />}

            <p className="total">{total} verified vote{total === 1 ? "" : "s"} so far</p>
          </div>

          <footer>
            <span>
              contract {poll.contract.slice(0, 8)}… · chain {poll.chainId}
              {isReal && (
                <>
                  {" · "}
                  <a href={`https://sepolia.etherscan.io/address/${poll.contract}`} target="_blank" rel="noreferrer">
                    etherscan
                  </a>
                </>
              )}
            </span>
          </footer>
        </main>
      )}
    </div>
  );
}
