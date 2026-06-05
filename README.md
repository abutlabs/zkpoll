# zkpoll

**Zero-Knowledge Proof Polling** — a daily polling system where every vote is provably cast by a unique, real citizen, and the entire tally lives on-chain where anyone can recount it.

The thesis: *a poll where you can mathematically prove every vote came from a unique real citizen, and recount it yourself. Can your government's poll do that?*

The first deployment targets **the Netherlands** 🇳🇱 on a `.nl` domain — one opinionated question per day, verified Dutch citizens only.

---

## How it works

Voters use [**zkPassport**](https://zkpassport.id/) — they tap their NFC passport / national ID / residence permit to their phone in the zkPassport mobile app. The app reads the chip, verifies the **issuing country's cryptographic signature** (so forgeries, deepfakes, and AI-generated IDs can't pass), and generates a **zero-knowledge proof** of *only* the attributes the poll asks for. The raw ID data **never leaves the phone** and never touches our servers or zkPassport's.

| Property | Detail |
|---|---|
| Coverage | **130+ countries** — any ID following the ICAO 9303 standard (chipped travel docs) |
| Attributes we request | `nationality` (must be 🇳🇱 Dutch), optional `age ≥ 18` |
| Sybil resistance | A **nullifier** unique per (person, poll) — see below |
| Verification | On-chain (EVM) via a Solidity verifier, in milliseconds |
| Cost | zkPassport's core verification is **free** (it's a pure cryptographic check) |
| SDK | `@zkpassport/sdk` / `@zkpassport/ui` (TypeScript, React/vanilla) |
| App | zkPassport iOS + Android; proof generation ~10s |

---

## The ZK mechanic: "one vote per poll" is a *mathematical* guarantee, not a promise

The key primitive is the **nullifier**. zkPassport derives a unique identifier like this:

```
nullifier = Poseidon2( passport_chip_data , domain , scope )
```

- `domain` = the app's domain (our `.nl` site)
- `scope` = a string **chosen per request**
- `passport_chip_data` = the secret that only ever exists on the user's phone

Three properties fall out of this hash, and they are what the system actually relies on:

1. **Deterministic** — the *same passport* + *same domain* + *same scope* always produces the *exact same nullifier*. A citizen cannot generate two different nullifiers for the same poll.
2. **Unique** — two *different* passports produce different nullifiers (collision resistance of Poseidon2).
3. **One-way & private** — the hash cannot be run backwards to recover the passport. The chain only ever sees a meaningless-looking number, never an identity.

**The core design decision:** set **`scope = pollId`** (e.g. `"nl-poll-2026-06-06"`).

Now each Dutch citizen produces **exactly one nullifier per poll**. The smart contract keeps a `mapping(uint256 => bool) usedNullifiers`:

- First vote → nullifier unused → accept, mark it used.
- Second attempt on the same poll → *identical* nullifier → **revert**.

It is **cryptographically impossible to vote twice on the same poll** — not "hard," not "we check a database," but: the same input produces the same number, and the contract already holds it. No server is trusted; the math enforces it and anyone can verify the chain.

A beautiful side effect: because `scope` changes every poll, the nullifiers for poll A and poll B are **unlinkable**. Nobody — not even the operators — can tell that a voter in Monday's poll is the same human as a voter in Tuesday's. You get per-poll Sybil resistance *and* cross-poll privacy for free.

---

## On-chain architecture (the chain *is* the database)

There is **no Postgres and no backend to trust**. The smart contract's storage is the database; a subgraph indexes it for a fast results page.

```
┌──────────────┐  scope = pollId   ┌───────────────────┐
│ Static web   │──── QR/deeplink ─►│ zkPassport app    │
│ (NL domain)  │                   │ (scans NL ID)     │
│ no backend!  │◄── proof + nullifier──────────────────┘
└──────┬───────┘
       │ vote(pollId, choice, proof, publicInputs)   (via gasless relayer)
       ▼
┌─────────────────────────────────────────────┐
│  NLPoll.sol  (on Base / an L2)               │
│  • verifier.verifyProof(...)   ← the math    │
│  • require nationality signal == "NLD"       │
│  • require age ≥ 18 (optional)               │
│  • require scope == pollId                   │
│  • require !usedNullifiers[n]  → mark used   │
│  • tally[pollId][choice] += 1                │
│  • emit Voted(pollId, choice)                │
└─────────────────────────────────────────────┘
       │ reads
       ▼
  The Graph / RPC  → results page (live, trustless tallies)
```

zkPassport ships Solidity for exactly this. You inherit their `AQueryProofExecutor`, which gives `_beforeVerify` / `_afterVerify` hooks around a generated `Verifier.sol` (a Groth16/Honk proof verifier). Use **`mode: "compressed-evm"`** in the SDK so the proof is cheap to verify on-chain.

```solidity
contract NLPoll is AQueryProofExecutor {
    mapping(uint256 => bool) public usedNullifiers;
    mapping(bytes32 => mapping(uint8 => uint256)) public tally; // pollId => choice => count

    function _beforeVerify(uint256 nullifier, /* disclosed signals */) internal {
        require(!usedNullifiers[nullifier], "already voted");
        require(_nationality == NLD, "not a Dutch citizen");
        require(_scope == currentPollId, "wrong poll");   // scope binds the proof to this poll
    }

    function _afterVerify(uint256 nullifier, uint8 choice) internal {
        usedNullifiers[nullifier] = true;   // the cryptographic ballot-box
        tally[currentPollId][choice] += 1;
    }
}
```

The proof's public signals carry: the **nullifier**, the **disclosed nationality** (so 🇳🇱 is enforced on-chain), optional **age ≥ 18**, the **domain**, and the **scope**. The verifier rejects any proof not signed by a real government's passport-signing key (the ICAO CSCA PKI). Eligibility, uniqueness, and the tally are *all* verified by code, on a public ledger.

### Two practical engineering problems (not ZK problems)

- **Gas** — citizens won't hold ETH. Use a **relayer / ERC-4337 paymaster** so the user just confirms in the app and a sponsor pays the few cents of gas on an L2 like Base. Keeps the barrier to entry low.
- **Vote tampering by the relayer** — since someone else submits the transaction, **bind the vote choice into the proof** (`.bind(...)`) so a relayer cannot flip "Yes" to "No." The choice becomes part of what the proof attests.

---

## Do you trust government voting, or the math behind ZK proofs?

Honest answer: **the math is more trustworthy than the math is *complete*.** What ZK buys you, and the gap that remains:

**What this system genuinely does better than a government election**
- **Verifiable eligibility** — every vote provably came from a real, government-issued Dutch ID. No ballot stuffing, no fake registrations.
- **Provable uniqueness** — one human, one nullifier, enforced by collision-resistant hashing, not by a clerk.
- **Public, recountable tally** — anyone on earth can recompute the result from the chain. No "trust us, here's the number."
- **No central point of tampering** — there is no election-night server an insider can edit.

**What ZK does *not* solve — where naive on-chain voting is actually *worse* than a secret ballot**
1. **Coercion & vote-buying (receipt-freeness).** A public on-chain vote is the *opposite* of a secret ballot. If a voter can prove how they voted, they can be coerced or sell their vote. The fix exists — **MACI (Minimal Anti-Collusion Infrastructure)** encrypts votes and produces a verifiable tally without revealing individual choices — but it is a serious addition.
2. **Ballot secrecy.** On-chain tallies leak each nullifier's choice. Fine for an opinion poll; unacceptable for a binding national election without an MACI / homomorphic layer.
3. **The eligibility root is still the government.** The proof is only as legitimate as the passport-signing PKI it checks. You "trust the math," but the math's *axiom* is "this government signed this chip." You haven't escaped government — you've made its signature **publicly auditable**, which is the actual win.
4. **The digital divide.** No smartphone, no NFC, no chipped ID → no vote. Results must be labelled **"% of *verified* Dutch citizens,"** not "% of Dutch citizens."
5. **Unsalted nullifiers** are theoretically de-anonymizable by a government holding the full chip database (zkPassport is rolling out vOPRF salting to close this).

**Bottom line:** For a **transparent, tamper-evident, one-person-one-vote opinion poll**, this math is far more trustworthy than an opaque online poll or a "trust us" tally — and the public auditability is a feature, not a bug. For **replacing a secret-ballot national election**, the math is necessary but not sufficient: you would add MACI for coercion-resistance before anyone should call it "better than what countries use today."

---

## Netherlands kickoff plan

1. **Contract** `NLPoll.sol` on **Base Sepolia** (testnet, free) → then Base mainnet. Inherit `AQueryProofExecutor`, enforce `nationality == NLD`, `scope == pollId`, `usedNullifiers`.
2. **Frontend**: static site on the `.nl` domain, `@zkpassport/ui` verify button, `scope: pollId`, `mode: "compressed-evm"`, bind the vote choice.
3. **Relayer**: a tiny gasless submitter (or ERC-4337 paymaster) so voting is free for citizens.
4. **Results**: a subgraph indexes `Voted` events → live tally page, no backend.
5. **One question a day**, with an OG share card: *"X% of verified Dutch citizens said YES today — provably. 🇳🇱"*

A good first milestone: write **`NLPoll.sol` plus a Foundry test that proves the double-vote revert** — watching the second vote bounce off the same nullifier in a passing test is the most convincing way to *feel* the guarantee.

---

## References

- [zkPassport](https://zkpassport.id/)
- [Basic Usage — SDK & queryBuilder](https://docs.zkpassport.id/getting-started/basic-usage)
- [FAQ — nullifier derivation](https://docs.zkpassport.id/faq)
- [Changelog — domain/scope rename](https://docs.zkpassport.id/changelog)
- [zkPassport GitHub (circuits / contracts)](https://github.com/zkpassport)
- [Rarimo — on-chain ZK passport verification guide](https://docs.rarimo.com/zk-passport/guide-on-chain-verification/)
- [Aztec — zkPassport case study](https://aztec.network/blog/zkpassport-case-study-a-look-into-online-identity-verification)
