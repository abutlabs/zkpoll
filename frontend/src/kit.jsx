// kit.jsx — icons, atoms, i18n (NL/EN), and on-chain data for klopthet.
// NOTE: all tallies are REAL and start at zero. No fabricated numbers anywhere.
import React from "react";

/* ── Icons ───────────────────────────────────────────────────── */
export const Ic = {
  shield: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>),
  lock: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg>),
  passport: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="10" r="2.6"/><path d="M9.5 16.5h5"/></svg>),
  nfc: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 5.5a11 11 0 0 1 0 13"/><path d="M11 7.5a6.5 6.5 0 0 1 0 9"/><path d="M15 9.5a2.4 2.4 0 0 1 0 5"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12.5l4.5 4.5L19 7"/></svg>),
  arrow: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>),
  chain: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.5 14.5l5-5"/><path d="M8 12l-2 2a3 3 0 0 0 4.2 4.2l2-2"/><path d="M16 12l2-2a3 3 0 0 0-4.2-4.2l-2 2"/></svg>),
  refresh: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><path d="M4 20v-4h4"/></svg>),
  close: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  ban: (p) => (<svg viewBox="0 0 24 24" width={p.s||20} height={p.s||20} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="8.5"/><path d="M6.5 6.5l11 11"/></svg>),
};

/* ── Wordmark: klopthet — "klopt het?" (does it add up?) ──────── */
export function Wordmark({ size = 22 }) {
  return (
    <span style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: size, letterSpacing: "-0.01em", color: "var(--text)" }}>
      <span style={{ color: "var(--accent)" }}>klopt</span>het
    </span>
  );
}

export function NLMark({ s = 26 }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", width: s, height: s, borderRadius: s * 0.28, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
      <span style={{ flex: 1, background: "#AE1C28" }} />
      <span style={{ flex: 1, background: "#F4F4F6" }} />
      <span style={{ flex: 1, background: "#21468B" }} />
    </span>
  );
}

export function USMark({ s = 26 }) {
  return (
    <span style={{ position: "relative", width: s, height: s, borderRadius: s * 0.28, overflow: "hidden", display: "inline-block", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)", background: "#fff" }}>
      {[0,1,2,3,4,5,6].map((i) => (<span key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i/7)*100}%`, height: `${100/7}%`, background: i % 2 === 0 ? "#B22234" : "#fff" }} />))}
      <span style={{ position: "absolute", top: 0, left: 0, width: "44%", height: `${(100/7)*4}%`, background: "#3C3B6E" }} />
    </span>
  );
}

// segmented NL / EN selector
export function LangSelect({ lang, onSet }) {
  const opt = (code, flag, label) => {
    const active = lang === code;
    return (
      <button onClick={() => onSet(code)} style={{ appearance: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 9px", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 11.5, letterSpacing: "0.04em",
        background: active ? "var(--bg)" : "transparent", color: active ? "var(--text)" : "var(--faint)",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.3)" : "none" }}>
        {flag} {label}
      </button>
    );
  };
  return (
    <div style={{ display: "inline-flex", gap: 2, padding: 3, background: "var(--surface)", border: "1px solid var(--line-soft)", borderRadius: 11 }}>
      {opt("nl", <NLMark s={15} />, "NL")}
      {opt("en", <USMark s={15} />, "EN")}
    </div>
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

/* ── Helpers + on-chain facts (real contract) ────────────────── */
export const fmt = (n) => n.toLocaleString("en-US");
const hexs = (len = 4) => Array.from({ length: len }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
export const newNullifier = () => `0x${hexs(4)}${hexs(4)}…${hexs(4)}`;

// The real deployed poll contract (verifies live zkPassport proofs). Recount points here.
export const CONTRACT = "0x6b34…36663";
export const CONTRACT_FULL = "0x6b34c201C947B3951d939A18548F6004BE136663";
export const CHAIN = { name: "Ethereum Sepolia", eco: "testnet", id: 11155111 };
export const ETHERSCAN = "https://sepolia.etherscan.io/address/0x6b34c201C947B3951d939A18548F6004BE136663";

const PALETTE = ["oklch(0.77 0.12 60)","oklch(0.74 0.11 205)","oklch(0.72 0.12 295)","oklch(0.76 0.12 150)","oklch(0.74 0.13 22)","oklch(0.75 0.12 330)"];
const colorsFor = (choices) => choices.length === 2 ? ["var(--no)", "var(--yes)"] : choices.map((_, i) => PALETTE[i % PALETTE.length]);

export const ELECTION = { id: "nl-live-2026", scope: "nl-live-2026" };

// Bilingual questions — choices keep the same length across languages. No baseTally: real zero.
const QDATA = [
  { id: "q-trump", tag: { en: "World affairs", nl: "Wereldzaken" }, short: { en: "Trump, honestly?", nl: "Trump, eerlijk?" },
    text: { en: "Donald Trump is best described as…", nl: "Donald Trump kun je het best omschrijven als…" },
    choices: { en: ["A clown", "A statesman", "A stable genius", "Who?"], nl: ["Een clown", "Een staatsman", "Een stabiel genie", "Wie?"] } },
  { id: "q-asylum", tag: { en: "Politics", nl: "Politiek" }, short: { en: "Asylum cap", nl: "Asiellimiet" },
    text: { en: "Should the Netherlands introduce a national cap on asylum migration?", nl: "Moet Nederland een nationale limiet op asielmigratie invoeren?" },
    choices: { en: ["No", "Yes"], nl: ["Nee", "Ja"] } },
  { id: "q-happy", tag: { en: "The big one", nl: "De grote vraag" }, short: { en: "Happy here?", nl: "Gelukkig hier?" },
    text: { en: "Honestly — are you happy living in the Netherlands?", nl: "Eerlijk — ben je gelukkig in Nederland?" },
    choices: { en: ["Yes, very", "It's fine", "Struggling", "I'd leave"], nl: ["Ja, heel blij", "Het gaat wel", "Ik worstel", "Ik wil weg"] } },
  { id: "q-budget", tag: { en: "Budget", nl: "Begroting" }, short: { en: "Top priority", nl: "Topprioriteit" },
    text: { en: "What should be the government's top spending priority?", nl: "Wat moet de hoogste uitgavenprioriteit van de regering zijn?" },
    choices: { en: ["Housing", "Healthcare", "Climate", "Defence"], nl: ["Wonen", "Zorg", "Klimaat", "Defensie"] } },
  { id: "q-fireworks", tag: { en: "Public safety", nl: "Veiligheid" }, short: { en: "Fireworks ban", nl: "Vuurwerkverbod" },
    text: { en: "Should consumer fireworks be banned nationwide on New Year's Eve?", nl: "Moet consumentenvuurwerk landelijk verboden worden met oud en nieuw?" },
    choices: { en: ["No", "Yes"], nl: ["Nee", "Ja"] } },
  { id: "q-accent", tag: { en: "Be honest", nl: "Wees eerlijk" }, short: { en: "Worst accent", nl: "Ergste accent" },
    text: { en: "Which accent secretly grates on you the most?", nl: "Welk accent irriteert je stiekem het meest?" },
    choices: { en: ["Amsterdam", "Rotterdam", "Limburg sing-song", "The hard G", "Americans trying Dutch", "Mine's flawless"], nl: ["Amsterdam", "Rotterdam", "Limburgs zangerig", "De harde G", "Amerikanen die Nederlands proberen", "De mijne is perfect"] } },
  { id: "q-stroopwafel", tag: { en: "Settle it", nl: "Beslis het" }, short: { en: "Stroopwafel @ 8am", nl: "Stroopwafel om 8u" },
    text: { en: "Is a stroopwafel an acceptable breakfast?", nl: "Is een stroopwafel een acceptabel ontbijt?" },
    choices: { en: ["No", "Yes"], nl: ["Nee", "Ja"] } },
].map((q) => ({ ...q, colors: colorsFor(q.choices.en) }));

const tr = (obj, lang) => (obj && obj[lang]) || (obj && obj.en) || obj;
export const Q = (lang) => QDATA.map((q) => ({ id: q.id, colors: q.colors, tag: tr(q.tag, lang), short: tr(q.short, lang), text: tr(q.text, lang), choices: tr(q.choices, lang) }));

// Real counts only — every question starts at zero.
export const baseTallies = () => Object.fromEntries(QDATA.map((q) => [q.id, q.choices.en.map(() => 0)]));
// The recount ledger shows REAL on-chain votes. Empty until real votes exist — never seeded.
export const seedLedger = () => [];

/* ── UI strings (nl / en). Honest preview framing baked in. ──── */
export const STR = {
  nl: {
    country: "Nederland", bannerTitle: "Nationale Opiniepeiling", verified: "preview",
    l_eyebrow: "Door burgers geverifieerde peilingen · Nederland",
    l_h1pre: "Wat vindt ons kleine landje ", l_h1accent: "écht", l_h1post: "?",
    l_body: "Echte burgers, één geverifieerde stem per persoon. Elk antwoord komt bewijsbaar van een unieke Nederlandse burger — en de hele telling staat on-chain, voor iedereen om in te zien en na te tellen. Zo zouden verkiezingen eruit kunnen zien.",
    preview: "Vroege preview. Dit laat zien hoe het zal werken. On-chain stemmen is nog niet aangesloten — hier wordt geen echte stem uitgebracht of resultaat vastgelegd.",
    banner_tagline: "Echte burgers · één stem per persoon · door iedereen te controleren",
    banner_preview: "Stemmen is nog niet aangesloten — deze tellingen zijn echt en beginnen op nul.",
    l_s1t: "Bewijs dat je burger bent", l_s1b: "Houd je Nederlandse ID tegen je telefoon. Er wordt een zero-knowledge bewijs gedeeld — niet je identiteit.",
    l_s2t: "Stem één keer, privé", l_s2b: "Een nullifier per vraag maakt een tweede stem cryptografisch onmogelijk — en je antwoorden zijn niet naar jou te herleiden.",
    l_s3t: "Tel mee op een publiek grootboek", l_s3b: "De chain is de database. Er is geen server om te vertrouwen en geen uitslag die je op geloof moet aannemen.",
    l_cta: "Bekijk het stembiljet", l_foot: "Resultaten gelden voor % van geverifieerde Nederlandse burgers, niet van iedereen.",
    realVotes: "echte stemmen tot nu toe", theBallot: "Het stembiljet", questions: "vragen", cast: "uitgebracht",
    trustless: "Hoe is dit zonder vertrouwen?", replay: "Speel demo opnieuw als nieuwe burger",
    verifyCast: "Preview: verifieer", answer: "antwoord", answers: "antwoorden",
    castCaption: "Een doorloop van hoe stemmen zal werken. Er wordt nog geen echte stem uitgebracht.",
    staged: "antwoord klaargezet", voted: "gestemd", yourVote: "jouw stem", answersSoFar: "antwoorden tot nu toe",
    r_back: "Het stembiljet", r_eyebrow: "De chain is de database", r_title: "Geen server om te vertrouwen. Tel het zelf na.",
    r_body: "Elke stem is een publiek on-chain record: een eenrichtings-nullifier, de vraag en het antwoord waaraan die gebonden is. Tel ze op — je krijgt dezelfde totalen als op het stembiljet.",
    r_contract: "contract", r_network: "netwerk", r_scope: "peiling-scope",
    r_yourBallot: "Jouw stembiljet on-chain", r_recent: "Recente on-chain stemmen", r_total: "totaal",
    r_empty: "Nog geen on-chain stemmen — wees de eerste geverifieerde burger die antwoordt.",
    r_match: "De totalen hier komen rechtstreeks uit het contract — tel ze zelf na, wanneer je wilt.",
    r_unlink: "Elke vraag gebruikt een eigen scope, dus je nullifiers zijn niet te koppelen tussen vragen of aan de volgende verkiezing. Uniek per vraag, blijvende privacy.",
    r_tryagain: "Probeer opnieuw te stemmen met hetzelfde paspoort",
    v_cast: "Preview · hoe stemmen zal werken", v_recast: "Je stembiljet opnieuw indienen", v_oneProof: "één bewijs",
    v_verifyT: "Verifieer met zkPassport", v_verifyB: "Houd je Nederlandse paspoort of ID tegen de bovenkant van je telefoon. De app bewijst dat je een stemgerechtigde burger bent.",
    v_privacyT: "Je ID verlaat je telefoon nooit", v_privacyB: "Alleen een zero-knowledge bewijs wordt gedeeld — nooit je naam, foto of documentnummer.",
    v_canApprove: "Dit apparaat kan goedkeuren — geen QR nodig", v_open: "Open zkPassport",
    v_scanT: "Houd je ID tegen de telefoon", v_scanB: "Houd je paspoort of ID-kaart tegen de bovenrand terwijl de chip wordt gelezen.",
    v_provEyebrow: "zkPassport · op je apparaat", v_provT1: "Je zero-knowledge", v_provT2: "bewijs genereren",
    v_step1: "Paspoortchip lezen", v_step2: "Sleutel van uitgevend land verifiëren (ICAO)", v_step3: "Nullifiers per vraag afleiden", v_bind: "Je # binden in het bewijs",
    v_reassure: "Volledig op je telefoon berekend. Je chipgegevens worden nooit geüpload.",
    v_relayT: "Naar de chain versturen", v_relayB: "Zo gaat het straks: een gesponsorde relayer betaalt de gas — gratis voor jou.",
    v_okT: "Dat is de flow — een preview", v_okB: "Er is geen echte stem uitgebracht en er is niets on-chain geschreven. Als stemmen live gaat, legt deze flow je # echt vast — elk met een eigen nullifier.",
    v_spent: "De nullifiers hierboven zijn illustratief — on-chain stemmen is nog niet aangesloten.",
    v_recount: "Tel het zelf na", v_backBallot: "Terug naar het stembiljet",
    v_rejT: "Dit paspoort heeft al gestemd", v_rejB1: "Het bewijs is geldig — maar het leidt ", v_rejBsame: "dezelfde nullifiers", v_rejB2: " af die het contract al heeft voor deze peiling. De chain weigerde het tweede stembiljet automatisch.",
    v_spentLabel: "nullifier (al verbruikt)",
    d_sub: "Deze computer kan je ID niet lezen. Scan de code met je telefoon en keur goed — je # blijft privé.",
    d_waiting: "Wachten tot je scant…", d_scanned: "Open het verzoek op je telefoon", d_approving: "Keur goed in de zkPassport-app…",
    d_step1: "Open zkPassport op je telefoon", d_step2: "Scan deze QR-code", d_step3: "Keur het verzoek goed", d_noApp: "Nog geen app?",
    ballotOf: "stembiljet van",
  },
  en: {
    country: "Netherlands", bannerTitle: "National Opinion Poll", verified: "preview",
    l_eyebrow: "Citizen-verified national polls · Netherlands",
    l_h1pre: "What does our little country ", l_h1accent: "actually", l_h1post: " think?",
    l_body: "Real citizens, one verified vote each. Every answer is proven to come from a unique Dutch citizen — and the whole tally lives on-chain, open for anyone to inspect and recount. This is what elections could be.",
    preview: "Early preview. This shows how it will work. On-chain voting isn't connected yet — nothing here casts a real vote or records real results.",
    banner_tagline: "Real citizens · one vote each · verifiable by anyone",
    banner_preview: "Voting isn't connected yet — these counts are real and start at zero.",
    l_s1t: "Prove you're a citizen", l_s1b: "Tap your Dutch ID to your phone. A zero-knowledge proof — not your identity — is shared.",
    l_s2t: "Answer once, privately", l_s2b: "A per-question nullifier makes a second vote cryptographically impossible — and your answers can't be linked back to you.",
    l_s3t: "Count it on a public ledger", l_s3b: "The chain is the database. There's no server to trust and no result to take on faith.",
    l_cta: "See the ballot", l_foot: "Results read % of verified Dutch citizens, not of everyone.",
    realVotes: "real votes so far", theBallot: "The ballot", questions: "questions", cast: "cast",
    trustless: "How is this trustless?", replay: "Replay demo as a new citizen",
    verifyCast: "Preview: verify", answer: "answer", answers: "answers",
    castCaption: "A walkthrough of how casting will work. No real vote is cast yet.",
    staged: "answer staged", voted: "voted", yourVote: "your vote", answersSoFar: "answers so far",
    r_back: "The ballot", r_eyebrow: "The chain is the database", r_title: "No server to trust. Recount it yourself.",
    r_body: "Every vote is a public on-chain record: a one-way nullifier, the question, and the answer it was bound to. Add them up — you'll get the same totals shown on the ballot.",
    r_contract: "contract", r_network: "network", r_scope: "poll scope",
    r_yourBallot: "Your ballot on-chain", r_recent: "Recent on-chain votes", r_total: "total",
    r_empty: "No on-chain votes yet — be the first verified citizen to answer.",
    r_match: "The totals here come straight from the contract — recount them yourself, anytime.",
    r_unlink: "Each question uses its own scope, so your nullifiers can't be linked across questions or to the next election. Per-question uniqueness, lasting privacy.",
    r_tryagain: "Try to vote again with the same passport",
    v_cast: "Preview · how casting will work", v_recast: "Re-submitting your ballot", v_oneProof: "one proof",
    v_verifyT: "Verify with zkPassport", v_verifyB: "Tap your Dutch passport or ID to the top of your phone. The app proves you're an eligible citizen.",
    v_privacyT: "Your ID never leaves the phone", v_privacyB: "Only a zero-knowledge proof is shared — never your name, photo, or document number.",
    v_canApprove: "This device can approve — no QR needed", v_open: "Open zkPassport",
    v_scanT: "Hold your ID to the phone", v_scanB: "Keep your passport or ID card against the top edge while the chip is read.",
    v_provEyebrow: "zkPassport · on your device", v_provT1: "Generating your", v_provT2: "zero-knowledge proof",
    v_step1: "Reading passport chip", v_step2: "Verifying issuing-country key (ICAO)", v_step3: "Deriving per-question nullifiers", v_bind: "Binding your # into the proof",
    v_reassure: "Computed entirely on your phone. Your chip data is never uploaded.",
    v_relayT: "Submitting to the chain", v_relayB: "How it'll work: a sponsored relayer pays the gas — free for you.",
    v_okT: "That's the flow — a preview", v_okB: "No real vote was cast and nothing was written on-chain. When voting goes live, this exact flow records your # for real — one nullifier each.",
    v_spent: "The nullifiers above are illustrative — on-chain voting isn't connected yet.",
    v_recount: "Recount it yourself", v_backBallot: "Back to the ballot",
    v_rejT: "This passport already voted", v_rejB1: "The proof is valid — but it derives the ", v_rejBsame: "same nullifiers", v_rejB2: " the contract already holds for this poll. The chain rejected the second ballot automatically.",
    v_spentLabel: "nullifier (already spent)",
    d_sub: "This computer can't read your ID. Scan the code with your phone and approve — your # stays private.",
    d_waiting: "Waiting for you to scan…", d_scanned: "Open the request on your phone", d_approving: "Approve in the zkPassport app…",
    d_step1: "Open zkPassport on your phone", d_step2: "Scan this QR code", d_step3: "Approve the request", d_noApp: "No app yet?",
    ballotOf: "ballot of",
  },
};

export function QRCode({ size = 232 }) {
  const N = 27, quiet = 1, total = N + quiet * 2, unit = size / total;
  const inBox = (r, c, br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
  const isFinder = (r, c) => inBox(r, c, 0, 0) || inBox(r, c, 0, N - 7) || inBox(r, c, N - 7, 0);
  const finderOn = (r, c) => {
    const pat = (br, bc) => { const lr = r - br, lc = c - bc; return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4); };
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
