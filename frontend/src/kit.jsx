// kit.jsx — icons, atoms, helpers, and demo on-chain data for klopthet.
import React from "react";

/* ── Icons — minimal line glyphs (24×24, currentColor) ───────── */
export const Ic = {
  shield: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  lock: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>
    </svg>
  ),
  passport: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="10" r="2.6"/><path d="M9.5 16.5h5"/>
    </svg>
  ),
  nfc: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 5.5a11 11 0 0 1 0 13"/><path d="M11 7.5a6.5 6.5 0 0 1 0 9"/><path d="M15 9.5a2.4 2.4 0 0 1 0 5"/>
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7"/>
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  back: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6"/>
    </svg>
  ),
  chain: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9.5 14.5l5-5"/><path d="M8 12l-2 2a3 3 0 0 0 4.2 4.2l2-2"/><path d="M16 12l2-2a3 3 0 0 0-4.2-4.2l-2 2"/>
    </svg>
  ),
  refresh: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><path d="M4 20v-4h4"/>
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  ban: (p) => (
    <svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="8.5"/><path d="M6.5 6.5l11 11"/>
    </svg>
  ),
};

/* ── Wordmark: "klopthet" — the brand asks "klopt het?" (does it add up?) ── */
export function Wordmark({ size = 22 }) {
  return (
    <span style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: size, letterSpacing: "-0.01em", color: "var(--text)" }}>
      <span style={{ color: "var(--accent)" }}>klopt</span>het
    </span>
  );
}

/* A tiny NL roundel — three stacked flag bars, kept abstract */
export function NLMark({ s = 26 }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", width: s, height: s, borderRadius: s * 0.28, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
      <span style={{ flex: 1, background: "#AE1C28" }} />
      <span style={{ flex: 1, background: "#F4F4F6" }} />
      <span style={{ flex: 1, background: "#21468B" }} />
    </span>
  );
}

export function Spinner({ s = 18, c = "currentColor", w = 2.2 }) {
  return (
    <span style={{ display: "inline-block", width: s, height: s, animation: "spin 0.9s linear infinite" }}>
      <svg viewBox="0 0 24 24" width={s} height={s} fill="none">
        <circle cx="12" cy="12" r="9" stroke={c} strokeOpacity="0.2" strokeWidth={w} />
        <path d="M21 12a9 9 0 0 0-9-9" stroke={c} strokeWidth={w} strokeLinecap="round" />
      </svg>
    </span>
  );
}

/* ── Helpers + demo on-chain data ────────────────────────────── */
export const fmt = (n) => n.toLocaleString("en-US");
const hexs = (len = 4) => Array.from({ length: len }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
export const newNullifier = () => `0x${hexs(4)}${hexs(4)}…${hexs(4)}`;

// The real deployed poll contract (verifies live zkPassport proofs). Recount points here.
export const CONTRACT = "0x6b34…36663";
export const CONTRACT_FULL = "0x6b34c201C947B3951d939A18548F6004BE136663";
export const CHAIN = { name: "Ethereum Sepolia", eco: "testnet", id: 11155111 };
export const ETHERSCAN = "https://sepolia.etherscan.io/address/0x6b34c201C947B3951d939A18548F6004BE136663";

const PALETTE = [
  "oklch(0.77 0.12 60)", "oklch(0.74 0.11 205)", "oklch(0.72 0.12 295)",
  "oklch(0.76 0.12 150)", "oklch(0.74 0.13 22)", "oklch(0.75 0.12 330)",
];
export const colorsFor = (choices) =>
  choices.length === 2 ? ["var(--no)", "var(--yes)"] : choices.map((_, i) => PALETTE[i % PALETTE.length]);

// An always-open poll — no fixed cadence, no end date. Verified citizens answer over time.
export const ELECTION = {
  id: "nl-live-2026", scope: "nl-live-2026", country: "Netherlands",
  title: "Live opinion poll",
};

export const QUESTIONS = [
  { id: "q-trains", tag: "Transport", short: "Cheaper trains",
    text: "Should domestic train travel be made cheaper than flying?",
    choices: ["No", "Yes"] },
  { id: "q-vote16", tag: "Democracy", short: "Voting at 16",
    text: "Should 16- and 17-year-olds be allowed to vote in national elections?",
    choices: ["No", "Yes"] },
  { id: "q-trump", tag: "World affairs", short: "Trump, honestly?",
    text: "Donald Trump is best described as…",
    choices: ["A clown", "A statesman", "A stable genius", "Who?"] },
  { id: "q-budget", tag: "Budget", short: "Top priority",
    text: "What should be the government's top spending priority?",
    choices: ["Housing", "Healthcare", "Climate", "Defence"] },
  { id: "q-fireworks", tag: "Public safety", short: "Fireworks ban",
    text: "Should consumer fireworks be banned nationwide on New Year's Eve?",
    choices: ["No", "Yes"] },
  { id: "q-stroopwafel", tag: "Settle it", short: "Stroopwafel @ 8am",
    text: "Is a stroopwafel an acceptable breakfast?",
    choices: ["No", "Yes"] },
].map((q) => ({ ...q, colors: colorsFor(q.choices) }));

// Real counts only. Every question starts at zero — no fabricated numbers, ever.
export const baseTallies = () => Object.fromEntries(QUESTIONS.map((q) => [q.id, q.choices.map(() => 0)]));

// The recount ledger shows REAL on-chain votes. Empty until real votes exist — never seeded.
export function seedLedger() {
  return [];
}

/* QR placeholder — a believable stand-in, not a real encoding. */
export function QRCode({ size = 232 }) {
  const N = 27, quiet = 1, total = N + quiet * 2, unit = size / total;
  const inBox = (r, c, br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
  const isFinder = (r, c) => inBox(r, c, 0, 0) || inBox(r, c, 0, N - 7) || inBox(r, c, N - 7, 0);
  const finderOn = (r, c) => {
    const pat = (br, bc) => { const lr = r - br, lc = c - bc;
      return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4); };
    if (r < 7 && c < 7) return pat(0, 0);
    if (r < 7 && c >= N - 7) return pat(0, N - 7);
    if (r >= N - 7 && c < 7) return pat(N - 7, 0);
    return false;
  };
  const cc = (N - 1) / 2, rects = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (Math.abs(r - cc) < 3 && Math.abs(c - cc) < 3) continue;
    let on;
    if (isFinder(r, c)) on = finderOn(r, c);
    else { const h = ((r * 73856093) ^ (c * 19349663) ^ (r * c * 83492791)) >>> 0; on = (h % 100) < 47; }
    if (on) rects.push(<rect key={`${r}-${c}`} x={(c + quiet) * unit} y={(r + quiet) * unit} width={unit * 1.04} height={unit * 1.04} rx={unit * 0.18} fill="#0b0d12" />);
  }
  return (
    <div style={{ width: size, height: size, background: "#fff", borderRadius: 16, position: "relative" }}>
      <svg width={size} height={size}>{rects}</svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * 0.2, height: size * 0.2, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 5px #fff" }}>
          <NLMark s={size * 0.14} />
        </div>
      </div>
    </div>
  );
}

export function StoreBadge({ store }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line-soft)" }}>
      <span style={{ color: "var(--text)" }}>
        {store === "ios"
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3l11 9-11 9V3z"/></svg>}
      </span>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: 8, color: "var(--faint)" }}>{store === "ios" ? "Download on the" : "Get it on"}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{store === "ios" ? "App Store" : "Google Play"}</div>
      </div>
    </div>
  );
}
