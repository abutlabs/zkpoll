// flow.jsx — zkPassport verify. Two adaptive experiences:
//   mobile  → this device can approve: hand off to the app, scan, prove on-device
//   desktop → can't read your ID here: show a QR, approve remotely on your phone
import React, { useState, useEffect } from "react";
import { Ic, Spinner, QRCode, StoreBadge, newNullifier, ELECTION, CHAIN } from "./kit.jsx";

const PROOF_STEPS = [
  "Reading passport chip",
  "Verifying issuing-country key (ICAO)",
  "Deriving per-question nullifiers",
];

export function VerifySheet(props) {
  return props.platform === "desktop" ? <DesktopVerify {...props} /> : <MobileVerify {...props} />;
}

/* ── MOBILE — full-screen sheet, on-device scan + proof ──────── */
function MobileVerify({ answers, alreadyUsed, onClose, onResult }) {
  const [stage, setStage] = useState("intro");   // intro → scanning → proving → relaying → success | rejected
  const [proofStep, setProofStep] = useState(0);
  const [pct, setPct] = useState(0);
  const [tx] = useState(newNullifier);
  const n = answers.length;
  const steps = [...PROOF_STEPS, `Binding your ${n} answer${n === 1 ? "" : "s"} into the proof`];

  useEffect(() => {
    let timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    if (stage === "scanning") at(1700, () => setStage("proving"));
    else if (stage === "proving") {
      steps.forEach((_, i) => at(180 + i * 600, () => setProofStep(i + 1)));
      const dur = 2500, start = performance.now();
      const iv = setInterval(() => { const e = Math.min(1, (performance.now() - start) / dur); setPct(Math.round(e * 100)); if (e >= 1) clearInterval(iv); }, 40);
      timers.push(iv);
      at(dur + 80, () => { setPct(100); setStage("relaying"); });
    } else if (stage === "relaying") at(1350, () => setStage(alreadyUsed ? "rejected" : "success"));
    return () => timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  }, [stage]); // eslint-disable-line

  const dismissable = stage === "intro" || stage === "success" || stage === "rejected";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column",
      background: "color-mix(in oklch, var(--bg) 80%, black)", animation: "rise .3s ease both" }}>
      <div className="top" />
      <div className="pad" style={{ display: "flex", justifyContent: "flex-end", height: 44, alignItems: "center" }}>
        {dismissable && <CloseBtn onClose={onClose} />}
      </div>
      <div className="scroll pad" style={{ display: "flex", flexDirection: "column" }}>
        {stage === "intro"    && <MobileIntro answers={answers} reattempt={alreadyUsed} onGo={() => setStage("scanning")} />}
        {stage === "scanning" && <Scanning />}
        {stage === "proving"  && <Proving steps={steps} step={proofStep} pct={pct} />}
        {stage === "relaying" && <Relaying />}
        {stage === "success"  && <Success answers={answers} onRecount={() => onResult("success", { tx }, "recount")} onDone={() => onResult("success", { tx }, "ballot")} />}
        {stage === "rejected" && <Rejected answers={answers} onClose={onClose} />}
      </div>
    </div>
  );
}

function MobileIntro({ answers, reattempt, onGo }) {
  const n = answers.length;
  return (
    <div className="rise" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="eyebrow">{reattempt ? "Re-submitting your ballot" : "Casting your ballot"}</div>
      <div style={{ fontSize: 29, fontWeight: 700, letterSpacing: "-0.02em", margin: "10px 0 18px" }}>
        {n} answer{n === 1 ? "" : "s"}, one proof
      </div>
      <AnswerList answers={answers} />
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>
        <InfoRow icon={<Ic.passport s={22} />} title="Verify with zkPassport" body="Tap your Dutch passport or ID to the top of your phone. The app proves you're an eligible citizen." />
        <div style={{ height: 1, background: "var(--line-soft)" }} />
        <InfoRow icon={<Ic.lock s={22} />} title="Your ID never leaves the phone" body="Only a zero-knowledge proof is shared — never your name, photo, or document number." />
      </div>
      <div className="chip" style={{ alignSelf: "flex-start", marginTop: 16 }}><Ic.chain s={13} /> scope = {ELECTION.id}</div>
      <div style={{ flex: 1 }} />
      <div className="bottom-safe" style={{ paddingTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "var(--yes)", fontSize: 12.5, marginBottom: 12 }}>
          <Ic.check s={14} /> This device can approve — no QR needed
        </div>
        <button className="btn btn-primary" onClick={onGo}><Ic.passport s={19} /> Open zkPassport</button>
      </div>
    </div>
  );
}

/* ── DESKTOP — centered modal, QR + remote approval on phone ── */
function DesktopVerify({ answers, alreadyUsed, onClose, onResult }) {
  const [stage, setStage] = useState("qr");        // qr → relaying → success | rejected
  const [status, setStatus] = useState("waiting"); // waiting → scanned → approving
  const [tx] = useState(newNullifier);

  useEffect(() => {
    let timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    if (stage === "qr") {
      at(2600, () => setStatus("scanned"));
      at(4400, () => setStatus("approving"));
      at(6000, () => setStage("relaying"));
    } else if (stage === "relaying") at(1400, () => setStage(alreadyUsed ? "rejected" : "success"));
    return () => timers.forEach(clearTimeout);
  }, [stage]); // eslint-disable-line

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 28,
      background: "color-mix(in oklch, var(--bg) 60%, rgba(0,0,0,0.6))", backdropFilter: "blur(3px)", animation: "rise .25s ease both" }}>
      <div className="card" style={{ width: 468, maxWidth: "100%", maxHeight: "92%", overflowY: "auto", padding: 0, background: "var(--bg-2)", borderColor: "var(--line)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 14px 0" }}><CloseBtn onClose={onClose} /></div>
        <div style={{ padding: "0 30px 30px" }}>
          {stage === "qr"       && <DesktopApprove answers={answers} status={status} reattempt={alreadyUsed} />}
          {stage === "relaying" && <div style={{ padding: "30px 0" }}><Relaying /></div>}
          {stage === "success"  && <Success answers={answers} compact onRecount={() => onResult("success", { tx }, "recount")} onDone={() => onResult("success", { tx }, "ballot")} />}
          {stage === "rejected" && <Rejected answers={answers} compact onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function DesktopApprove({ answers, status, reattempt }) {
  const n = answers.length;
  const scanned = status !== "waiting";
  const statusText = { waiting: "Waiting for you to scan…", scanned: "Open the request on your phone", approving: "Approve in the zkPassport app…" }[status];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--accent)" }}><Ic.passport s={22} /></span>
        <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>Verify with zkPassport</span>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.5, margin: "8px 0 0", maxWidth: 340 }}>
        This computer can't read your ID. Scan the code with your phone and approve — your {reattempt ? "re-submitted " : ""}ballot of {n} answer{n === 1 ? "" : "s"} stays private.
      </p>

      <div style={{ position: "relative", marginTop: 20 }}>
        <div style={{ padding: 12, background: "#fff", borderRadius: 20, opacity: scanned ? 0.4 : 1, transition: "opacity .3s" }}>
          <QRCode size={208} />
        </div>
        {scanned && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 64, height: 64, borderRadius: 999, background: "var(--yes)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pop .4s cubic-bezier(.2,.7,.2,1) both" }}><Ic.check s={34} /></span>
          </div>
        )}
      </div>

      <div className="chip" style={{ marginTop: 18, padding: "8px 14px", borderColor: "color-mix(in oklch, var(--accent) 35%, transparent)", color: "var(--text)" }}>
        {status !== "scanned" ? <Spinner s={14} c="var(--accent)" /> : <span style={{ color: "var(--yes)" }}><Ic.check s={14} /></span>}
        {statusText}
      </div>

      <div style={{ width: "100%", marginTop: 22, display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
        {[["Open zkPassport on your phone", <Ic.passport s={16} />], ["Scan this QR code", <Ic.nfc s={16} />], ["Approve the request", <Ic.shield s={16} />]].map(([label], i) => {
          const isDone = (i === 0 && scanned) || (i === 1 && scanned);
          const active = (i === 0 && !scanned) || (i === 2 && status === "approving");
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", opacity: isDone || active ? 1 : 0.5, transition: "opacity .3s" }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: isDone ? "var(--accent)" : "var(--surface)", color: isDone ? "var(--accent-ink)" : "var(--faint)", border: isDone ? "none" : "1px solid var(--line)" }}>
                {isDone ? <Ic.check s={13} /> : active ? <Spinner s={12} c="var(--accent)" /> : <span className="num" style={{ fontSize: 11 }}>{i + 1}</span>}
              </span>
              <span style={{ fontSize: 13.5, color: isDone || active ? "var(--text)" : "var(--muted)" }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>No app yet?</span>
        <StoreBadge store="ios" />
        <StoreBadge store="android" />
      </div>

      <div className="chip" style={{ marginTop: 16, fontSize: 11 }}><Ic.chain s={12} /> scope = {ELECTION.id}</div>
    </div>
  );
}

/* ── Shared pieces ───────────────────────────────────────────── */
function CloseBtn({ onClose }) {
  return (
    <button className="btn" onClick={onClose} style={{ width: 40, height: 40, padding: 0, borderRadius: 999, background: "var(--surface)", border: "1px solid var(--line-soft)", color: "var(--muted)" }}>
      <Ic.close s={18} />
    </button>
  );
}

function InfoRow({ icon, title, body }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span style={{ color: "var(--accent)", marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15.5 }}>{title}</div>
        <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 3, lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

function AnswerList({ answers }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid var(--line-soft)", borderRadius: 14, overflow: "hidden" }}>
      {answers.map((a, i) => (
        <div key={a.qid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", background: "var(--bg-2)", borderTop: i ? "1px solid var(--line-soft)" : "none" }}>
          <span style={{ flex: 1, fontSize: 14, color: "var(--muted)" }}>{a.short}</span>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: a.color }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: a.color }}>{a.label}</span>
        </div>
      ))}
    </div>
  );
}

function Scanning() {
  return (
    <div className="rise" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 60 }}>
      <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 30 }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: "2px solid var(--accent)", animation: `pulse-ring 1.8s ${i * 0.6}s cubic-bezier(.2,.6,.3,1) infinite` }} />)}
        <span style={{ position: "relative", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", width: 92, height: 92, borderRadius: 26, background: "var(--bg-2)", border: "1px solid var(--line)" }}><Ic.nfc s={42} /></span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>Hold your ID to the phone</div>
      <div style={{ color: "var(--muted)", fontSize: 14.5, marginTop: 8, maxWidth: 280, lineHeight: 1.5 }}>Keep your passport or ID card against the top edge while the chip is read.</div>
    </div>
  );
}

function Proving({ steps, step, pct }) {
  return (
    <div className="rise" style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 8 }}>
      <div className="eyebrow">zkPassport · on your device</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "10px 0 4px", textWrap: "balance" }}>Generating your<br/>zero-knowledge proof</div>
      <div className="num" style={{ fontSize: 54, fontWeight: 600, color: "var(--accent)", letterSpacing: "-0.03em", margin: "6px 0 20px" }}>{pct}<span style={{ fontSize: 26 }}>%</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {steps.map((label, i) => {
          const done = i < step, active = i === step;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", opacity: done || active ? 1 : 0.4, transition: "opacity .3s" }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: done ? "var(--accent)" : "var(--surface)", color: done ? "var(--accent-ink)" : "var(--faint)", border: done ? "none" : "1px solid var(--line)" }}>
                {done ? <Ic.check s={14} /> : active ? <Spinner s={13} c="var(--accent)" /> : <span className="num" style={{ fontSize: 11 }}>{i + 1}</span>}
              </span>
              <span className="mono" style={{ fontSize: 13.5, color: done || active ? "var(--text)" : "var(--faint)" }}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div className="bottom-safe" style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center", background: "var(--surface)", padding: "16px 18px", borderRadius: 16 }}>
        <span style={{ color: "var(--yes)", flexShrink: 0 }}><Ic.lock s={18} /></span>
        <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>Computed entirely on your phone. Your chip data is never uploaded.</span>
      </div>
    </div>
  );
}

function Relaying() {
  return (
    <div className="rise" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "30px 0" }}>
      <Spinner s={40} c="var(--accent)" w={2} />
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 24 }}>Submitting to the chain</div>
      <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 8, maxWidth: 270, lineHeight: 1.5 }}>A sponsored relayer is paying the gas on {CHAIN.name} — free for you.</div>
    </div>
  );
}

function Success({ answers, onRecount, onDone, compact }) {
  const n = answers.length;
  return (
    <div style={{ flex: compact ? "none" : 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: compact ? "none" : 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: compact ? 8 : 24 }}>
        <span style={{ width: 76, height: 76, borderRadius: 999, background: "var(--yes)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pop .5s cubic-bezier(.2,.7,.2,1) both", flexShrink: 0 }}><Ic.check s={40} /></span>
        <div className="rise" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 22 }}>Ballot counted on-chain</div>
        <div className="rise" style={{ color: "var(--muted)", fontSize: 15, marginTop: 8, maxWidth: 290, lineHeight: 1.5 }}>{n} answer{n === 1 ? "" : "s"} recorded in the {ELECTION.country} poll — each with its own nullifier.</div>
        <div className="card rise" style={{ width: "100%", marginTop: 24, textAlign: "left", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          {answers.map((a, i) => (
            <div key={a.qid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderTop: i ? "1px solid var(--line-soft)" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: a.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: "var(--text)" }}>{a.short}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--faint)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nullifier}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: a.color, flexShrink: 0, whiteSpace: "nowrap" }}>{a.label}</span>
            </div>
          ))}
        </div>
        <div style={{ color: "var(--faint)", fontSize: 12.5, marginTop: 12, lineHeight: 1.5, maxWidth: 320 }}>These nullifiers are now spent. The same passport can't cast a second ballot in this poll.</div>
      </div>
      <div className="bottom-safe" style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-primary" onClick={onRecount}><Ic.chain s={18} /> Recount it yourself</button>
        <button className="btn btn-quiet" onClick={onDone}>Back to the ballot</button>
      </div>
    </div>
  );
}

function Rejected({ answers, onClose, compact }) {
  return (
    <div style={{ flex: compact ? "none" : 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: compact ? "none" : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingTop: compact ? 8 : 0 }}>
        <span style={{ width: 76, height: 76, borderRadius: 999, background: "color-mix(in oklch, var(--no) 18%, var(--bg))", color: "var(--no)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid color-mix(in oklch, var(--no) 40%, transparent)", animation: "pop .5s cubic-bezier(.2,.7,.2,1) both" }}><Ic.ban s={38} /></span>
        <div className="mono rise" style={{ fontSize: 13, color: "var(--no)", marginTop: 22, letterSpacing: "0.04em" }}>REVERTED · AlreadyVoted</div>
        <div className="rise" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8, textWrap: "balance" }}>This passport already voted</div>
        <div className="rise" style={{ color: "var(--muted)", fontSize: 14.5, marginTop: 10, lineHeight: 1.55, maxWidth: 312 }}>
          The proof is valid — but it derives the <span style={{ color: "var(--text)" }}>same nullifiers</span> the contract already holds for this poll. The chain rejected the second ballot automatically.
        </div>
        <div className="card rise" style={{ width: "100%", marginTop: 22, textAlign: "left", padding: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--faint)" }}>nullifier (already spent)</div>
          <div className="mono" style={{ fontSize: 13, color: "var(--text)", marginTop: 4 }}>{answers[0]?.nullifier}</div>
        </div>
      </div>
      <div className="bottom-safe" style={{ paddingTop: 20 }}>
        <button className="btn btn-ghost" onClick={onClose}>Back to the ballot</button>
      </div>
    </div>
  );
}
