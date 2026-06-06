// App.jsx — one responsive experience. Platform is detected (not staged in device frames):
//   phone browser  → verify on-device (deep-link to zkPassport)
//   desktop browser → verify via QR, approve remotely. (Like DigiD.)
import React, { useState, useMemo, useEffect } from "react";
import { Landing, Ballot, Recount } from "./screens.jsx";
import { VerifySheet } from "./flow.jsx";
import { QUESTIONS, baseTallies, seedLedger, newNullifier } from "./kit.jsx";

function detectPlatform() {
  if (typeof window === "undefined") return "mobile";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 720px)").matches;
  return coarse || narrow ? "mobile" : "desktop";
}

function usePlatform() {
  const [platform, setPlatform] = useState(detectPlatform);
  useEffect(() => {
    const onResize = () => setPlatform(detectPlatform());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return platform;
}

export default function App() {
  const platform = usePlatform();
  const desktop = platform === "desktop";

  const [route, setRoute] = useState("landing");       // landing | ballot | recount
  const [tallies, setTallies] = useState(baseTallies); // { qid: number[] }
  const [staged, setStaged] = useState({});            // { qid: choiceIdx } not yet cast
  const [cast, setCast] = useState({});                // { qid: { choice, nullifier } }
  const [verify, setVerify] = useState(null);          // null | { answers, alreadyUsed }
  const ledger = useMemo(() => seedLedger(8), []);

  const pick = (qid, choice) => {
    if (cast[qid] !== undefined) return;
    setStaged((prev) => ({ ...prev, [qid]: choice }));
  };

  const startCast = () => {
    const answers = Object.entries(staged).map(([qid, choice]) => {
      const q = QUESTIONS.find((x) => x.id === qid);
      return { qid, short: q.short, choice, label: q.choices[choice], color: q.colors[choice], nullifier: newNullifier() };
    });
    setVerify({ answers, alreadyUsed: false });
  };

  const tryAgain = () => {
    const answers = Object.entries(cast).map(([qid, v]) => {
      const q = QUESTIONS.find((x) => x.id === qid);
      return { qid, short: q.short, choice: v.choice, label: q.choices[v.choice], color: q.colors[v.choice], nullifier: v.nullifier };
    });
    setVerify({ answers, alreadyUsed: true });
  };

  const handleResult = (kind, payload, dest) => {
    if (kind === "success" && verify && !verify.alreadyUsed) {
      setTallies((prev) => {
        const next = { ...prev };
        verify.answers.forEach((a) => { next[a.qid] = [...next[a.qid]]; next[a.qid][a.choice] += 1; });
        return next;
      });
      setCast((prev) => {
        const next = { ...prev };
        verify.answers.forEach((a) => { next[a.qid] = { choice: a.choice, nullifier: a.nullifier }; });
        return next;
      });
      setStaged({});
    }
    setVerify(null);
    if (dest) setRoute(dest);
  };

  const replay = () => { setStaged({}); setCast({}); setTallies(baseTallies()); setRoute("ballot"); };

  return (
    <div className={"app" + (desktop ? " desktop" : "")}>
      {route === "landing" && <Landing onEnter={() => setRoute("ballot")} />}
      {route === "ballot" && (
        <Ballot tallies={tallies} staged={staged} cast={cast} onPick={pick} onCast={startCast}
          onRecount={() => setRoute("recount")} onReplay={replay} />
      )}
      {route === "recount" && (
        <Recount tallies={tallies} ledger={ledger} cast={cast}
          onBack={() => setRoute("ballot")} onTryAgain={tryAgain} />
      )}
      {verify && (
        <VerifySheet platform={platform} answers={verify.answers} alreadyUsed={verify.alreadyUsed}
          onClose={() => setVerify(null)} onResult={handleResult} />
      )}
    </div>
  );
}
