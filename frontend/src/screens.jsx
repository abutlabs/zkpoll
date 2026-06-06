// screens.jsx — Landing, Ballot (home), Recount
import React from "react";
import { Ic, Wordmark, NLMark, fmt, CONTRACT, CONTRACT_FULL, CHAIN, ETHERSCAN, ELECTION, QUESTIONS } from "./kit.jsx";

/* ── Landing / first-time explainer ──────────────────────────── */
export function Landing({ onEnter }) {
  return (
    <div className="scroll">
      <div className="pad top" style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <Wordmark size={20} />
          <NLMark s={24} />
        </div>

        <div className="card" style={{ marginTop: 16, padding: "12px 14px", borderColor: "color-mix(in oklch, var(--accent) 30%, var(--line-soft))", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}><Ic.lock s={16} /></span>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
            <b style={{ color: "var(--text)" }}>Early preview.</b> This shows how it will work. On-chain voting isn't connected yet — nothing here casts a real vote or records real results.
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 24 }} />

        <div className="rise" style={{ marginTop: 40 }}>
          <div className="eyebrow">Live opinion poll · Netherlands</div>
          <h1 style={{ fontSize: 37, lineHeight: 1.06, fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", textWrap: "balance" }}>
            What does the country <span style={{ color: "var(--accent)" }}>actually</span> think?
          </h1>
          <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.55, marginTop: 16, maxWidth: 360 }}>
            A live poll answered by real, verified citizens. Every answer is proven to come from a unique Dutch citizen — no bots, no duplicates, no server to trust. The whole tally lives on-chain, so anyone can recount it. <span style={{ color: "var(--text)" }}>More trustworthy than an election — because you can check the math yourself.</span>
          </p>
        </div>

        <div className="card rise" style={{ marginTop: 28, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Step icon={<Ic.passport s={20} />} title="Prove you're a citizen" body="Tap your Dutch ID to your phone. A zero-knowledge proof — not your identity — is shared." />
          <div style={{ height: 1, background: "var(--line-soft)" }} />
          <Step icon={<Ic.lock s={20} />} title="Answer once, privately" body="A per-question nullifier makes a second vote cryptographically impossible — and your answers can't be linked back to you." />
          <div style={{ height: 1, background: "var(--line-soft)" }} />
          <Step icon={<Ic.chain s={20} />} title="Count it on a public ledger" body="The chain is the database. There's no server to trust and no result to take on faith." />
        </div>

        <div className="bottom-safe" style={{ paddingTop: 26 }}>
          <button className="btn btn-primary" onClick={onEnter}>See the ballot <Ic.arrow s={18} /></button>
          <p style={{ textAlign: "center", color: "var(--faint)", fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
            Results read <span className="mono">% of <span style={{ color: "var(--muted)" }}>verified</span> Dutch citizens</span>, not of everyone.
            <br />Early preview — live on-chain voting is being connected; counts are real and start at zero.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({ icon, title, body }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15.5 }}>{title}</div>
        <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 3, lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

/* ── Ballot — the home: read questions, stage answers ────────── */
export function Ballot({ tallies, staged, cast, onPick, onCast, onRecount, onReplay }) {
  const castCount = Object.keys(cast).length;
  const stagedCount = Object.keys(staged).length;
  // Real numbers only — the total comes straight from the live counts (starts at zero).
  const totalAnswers = Object.values(tallies).reduce((a, t) => a + t.reduce((x, c) => x + c, 0), 0);

  return (
    <React.Fragment>
      <div className="scroll">
        <div className="pad top">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <Wordmark size={20} />
            <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in oklch, var(--accent) 40%, transparent)" }}>preview</span>
          </div>

          <div className="card" style={{ marginTop: 18, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <NLMark s={30} />
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ color: "var(--muted)" }}>{ELECTION.country}</div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginTop: 2 }}>{ELECTION.title}</div>
              </div>
            </div>

            <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.5, margin: "14px 0 0" }}>
              How it will work: verified Dutch citizens only, every answer provable on-chain. Voting isn't connected yet — these counts are real and start at zero.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Stat value={fmt(totalAnswers)} unit="real votes so far" />
              <div style={{ width: 1, background: "var(--line-soft)" }} />
              <Stat value={`${QUESTIONS.length}`} unit="questions" />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "26px 2px 12px" }}>
            <span className="eyebrow">The ballot · {QUESTIONS.length} questions</span>
            {castCount > 0 && <span className="chip" style={{ color: "var(--yes)", borderColor: "color-mix(in oklch, var(--yes) 35%, transparent)" }}><Ic.check s={12} /> {castCount}/{QUESTIONS.length} cast</span>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {QUESTIONS.map((q, i) => (
              <QuestionCard key={q.id} index={i + 1} q={q} tally={tallies[q.id]}
                staged={staged[q.id]} cast={cast[q.id]?.choice} onPick={(c) => onPick(q.id, c)} />
            ))}
          </div>

          <button onClick={onRecount} style={{ appearance: "none", cursor: "pointer", width: "100%", textAlign: "left", marginTop: 16, padding: "14px 16px", borderRadius: 16, background: "var(--bg-2)", border: "1px solid var(--line-soft)", display: "flex", alignItems: "center", gap: 12, color: "inherit" }}>
            <span style={{ color: "var(--muted)" }}><Ic.chain s={18} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>How is this trustless?</div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{CONTRACT} · {CHAIN.name}</div>
            </div>
            <span style={{ color: "var(--faint)" }}><Ic.arrow s={16} /></span>
          </button>

          {castCount > 0 && (
            <button className="btn btn-quiet" onClick={onReplay} style={{ marginTop: 6 }}>
              <Ic.refresh s={15} /> Replay demo as a new citizen
            </button>
          )}

          <div style={{ height: stagedCount > 0 ? 132 : 44 }} />
        </div>
      </div>

      {stagedCount > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30, padding: "26px 22px max(34px, env(safe-area-inset-bottom))",
          background: "linear-gradient(to top, var(--bg) 58%, transparent)" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <button className="btn btn-primary" onClick={onCast}>
              <Ic.passport s={18} /> {`Preview the verify flow · ${stagedCount}`}
            </button>
            <p style={{ textAlign: "center", color: "var(--faint)", fontSize: 12, margin: "10px 0 0" }}>
              A walkthrough of how casting will work. No real vote is cast yet.
            </p>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function Stat({ value, unit, live }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {live && <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--yes)", boxShadow: "0 0 0 3px color-mix(in oklch, var(--yes) 22%, transparent)" }} />}
        <span className="num" style={{ fontSize: 22, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 3 }}>{unit}</div>
    </div>
  );
}

function QuestionCard({ index, q, tally, staged, cast, onPick }) {
  const total = tally.reduce((a, c) => a + c, 0);
  const pct = (i) => (total === 0 ? 0 : Math.round((tally[i] / total) * 100));
  const locked = cast !== undefined;
  const leadingIdx = total === 0 ? -1 : tally.indexOf(Math.max(...tally));

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="eyebrow">{index < 10 ? `0${index}` : index} · {q.tag}</span>
        {locked
          ? <span className="chip" style={{ color: "var(--yes)", borderColor: "color-mix(in oklch, var(--yes) 35%, transparent)" }}><Ic.check s={12} /> voted</span>
          : staged !== undefined
            ? <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in oklch, var(--accent) 40%, transparent)" }}>answer staged</span>
            : null}
      </div>
      <h3 style={{ fontSize: 19, lineHeight: 1.25, fontWeight: 600, letterSpacing: "-0.01em", margin: "10px 0 16px", textWrap: "balance" }}>{q.text}</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.choices.map((label, i) => {
          const picked = staged === i;
          const youVoted = cast === i;
          const hi = picked || youVoted;
          const faded = locked && !youVoted;
          return (
            <button key={i} onClick={() => !locked && onPick(i)} disabled={locked}
              style={{ appearance: "none", textAlign: "left", cursor: locked ? "default" : "pointer", width: "100%",
                padding: "11px 13px", borderRadius: 13, transition: "background .15s, border-color .15s, opacity .2s",
                background: hi ? "color-mix(in oklch, var(--accent) 9%, var(--bg-2))" : "transparent",
                border: `1px solid ${hi ? "color-mix(in oklch, var(--accent) 45%, transparent)" : "var(--line-soft)"}`,
                opacity: faded ? 0.5 : 1, color: "inherit", display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Radio on={hi} check={youVoted} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{label}</span>
                {youVoted && <span className="chip" style={{ padding: "3px 8px", color: "var(--accent)", borderColor: "color-mix(in oklch, var(--accent) 40%, transparent)" }}>your vote</span>}
                <span className="num" style={{ fontSize: 16, fontWeight: 600, color: i === leadingIdx ? "var(--text)" : "var(--muted)" }}>{pct(i)}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 9, borderRadius: 6, background: "var(--surface)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct(i)}%`, background: q.colors[i], borderRadius: 6, transition: "width .6s cubic-bezier(.2,.7,.2,1)" }} />
                </div>
                <span className="num" style={{ fontSize: 11.5, color: "var(--faint)", minWidth: 52, textAlign: "right" }}>{fmt(tally[i])}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="num" style={{ fontSize: 12, color: "var(--faint)", marginTop: 13 }}>{fmt(total)} answers so far</div>
    </div>
  );
}

function Radio({ on, check }) {
  return (
    <span style={{ width: 20, height: 20, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      border: on ? "none" : "2px solid var(--line)", background: on ? "var(--accent)" : "transparent", color: "var(--accent-ink)" }}>
      {check ? <Ic.check s={13} /> : on ? <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--accent-ink)" }} /> : null}
    </span>
  );
}

/* ── Recount — the chain is the database ─────────────────────── */
export function Recount({ tallies, ledger, cast, onBack, onTryAgain }) {
  const yourBallot = Object.entries(cast).map(([qid, v]) => {
    const q = QUESTIONS.find((x) => x.id === qid);
    return { qid, short: q.short, label: q.choices[v.choice], color: q.colors[v.choice], nullifier: v.nullifier };
  });
  const totalVotes = Object.values(tallies).reduce((a, t) => a + t.reduce((x, c) => x + c, 0), 0);

  return (
    <div className="scroll">
      <div className="pad top">
        <button className="btn" onClick={onBack} style={{ width: "auto", padding: "8px 14px 8px 10px", background: "var(--surface)", border: "1px solid var(--line-soft)", color: "var(--muted)", fontSize: 14, borderRadius: 12, marginTop: 4 }}>
          <Ic.back s={16} /> The ballot
        </button>

        <div style={{ marginTop: 22 }}>
          <div className="eyebrow">The chain is the database</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", margin: "10px 0 0", textWrap: "balance" }}>
            No server to trust. Recount it yourself.
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.55, marginTop: 12 }}>
            Every vote is a public on-chain record: a one-way nullifier, the question, and the answer it was bound to. Add them up — you'll get the same totals shown on the ballot.
          </p>
        </div>

        <div className="card" style={{ marginTop: 20, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <FactRow k="contract" v={CONTRACT_FULL} href={ETHERSCAN} />
          <div style={{ height: 1, background: "var(--line-soft)" }} />
          <FactRow k="network" v={`${CHAIN.name} · ${CHAIN.eco} · chainId ${CHAIN.id}`} />
          <div style={{ height: 1, background: "var(--line-soft)" }} />
          <FactRow k="poll scope" v={ELECTION.scope} />
        </div>

        {yourBallot.length > 0 && (
          <React.Fragment>
            <div className="eyebrow" style={{ display: "block", margin: "26px 0 12px" }}>Your ballot on-chain</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {yourBallot.map((a) => (
                <div key={a.qid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 13,
                  background: "color-mix(in oklch, var(--accent) 9%, var(--bg-2))", border: "1px solid color-mix(in oklch, var(--accent) 38%, transparent)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: a.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: "var(--text)" }}>{a.short}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--faint)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nullifier}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: a.color, flexShrink: 0, whiteSpace: "nowrap" }}>{a.label}</span>
                </div>
              ))}
            </div>
          </React.Fragment>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "26px 0 12px" }}>
          <span className="eyebrow">Recent on-chain votes</span>
          {totalVotes > 0 && <span className="eyebrow" style={{ color: "var(--muted)" }}>{fmt(totalVotes)} total</span>}
        </div>
        {ledger.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ledger.map((b, i) => <LedgerRow key={i} b={b} />)}
          </div>
        ) : (
          <div className="card" style={{ padding: 18, textAlign: "center", color: "var(--faint)", fontSize: 13, lineHeight: 1.5 }}>
            No on-chain votes yet — be the first verified citizen to answer.
          </div>
        )}

        <div className="card" style={{ marginTop: 16, padding: 16, borderColor: "color-mix(in oklch, var(--yes) 28%, var(--line-soft))", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: 999, background: "var(--yes)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic.check s={16} /></span>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>The totals here come straight from the contract — recount them yourself, anytime.</span>
        </div>

        <div style={{ display: "flex", gap: 11, marginTop: 16, padding: "0 2px", color: "var(--faint)", fontSize: 12.5, lineHeight: 1.55 }}>
          <span style={{ color: "var(--muted)", marginTop: 1 }}><Ic.lock s={15} /></span>
          <span>Each question uses its own scope, so your nullifiers can't be linked across questions or to the next election. Per-question uniqueness, lasting privacy.</span>
        </div>

        {yourBallot.length > 0 && (
          <button className="btn btn-ghost" onClick={onTryAgain} style={{ marginTop: 20 }}>
            <Ic.refresh s={16} /> Try to vote again with the same passport
          </button>
        )}
        <div className="bottom-safe" />
      </div>
    </div>
  );
}

function FactRow({ k, v, href }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{k}</span>
      {href ? (
        <a className="mono" href={href} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--accent)", wordBreak: "break-all", lineHeight: 1.4, textDecoration: "none" }}>{v} ↗</a>
      ) : (
        <span className="mono" style={{ fontSize: 12.5, color: "var(--text)", wordBreak: "break-all", lineHeight: 1.4 }}>{v}</span>
      )}
    </div>
  );
}

function LedgerRow({ b }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 13, background: "var(--bg-2)", border: "1px solid var(--line-soft)" }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: b.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 12.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.nullifier}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{b.qShort} · {b.ago}</div>
      </div>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: b.color, flexShrink: 0, whiteSpace: "nowrap" }}>{b.label}</span>
    </div>
  );
}
