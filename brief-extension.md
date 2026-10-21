# Extension brief — `crypto-lab-hash-hunt`

**2026-10-20. Extension to a live lab; no new repository.** Written against
`crypto-lab-hash-hunt` at `3c766455e051` and `audits/_MASTER-TEMPLATE.md` (catalog `20cb434d89e4`).
Template §5: "Extend, never restructure." Source of the gap: Boneh–Shoup, *A Graduate Course in
Applied Cryptography*, v0.6 (Jan. 2023), §8.4 and §8.4.1 "Joux's attack".

**Sequencing:** Hash Hunt is the Katz–Lindell-batch lab being finished now. Build this only after
that work has shipped, then run `git log --oneline 3c766455e051..HEAD` and re-derive every
file:line below against HEAD before coding.

**Verdict: extension — one new tab ("Multicollisions") appended after "Salt experiment".**

## What the lab has now

- Five tabs registered in `src/main.ts:32` `mount(...)`: Birthday room, Collision hunt, Meaningful
  forgery, Chained tables, Salt experiment; eyebrows are hard-coded ("01 / …" … "06 / …").
- `src/hash/truncate.ts`: `fullHash` (:3, @noble/hashes SHA-256 of a UTF-8 string), `truncate`
  (:5, **refuses t outside 1–24**), `hash(m, t)` (:6), `counted(t, max=2_000_000, ms=15_000)` (:8,
  the evaluation/time budget wrapper), `calibrate()` (:11, measured short-message rate).
- `src/attack/floyd.ts:2` `floydMap(f, start, limit)` — Floyd over an arbitrary
  `string → string` map, returning distinct predecessors `left`, `right` with `f(left) = f(right)`.
  `src/attack/birthday.ts:2` `tableCollision(t)` is hard-wired to `hash(m, t)`.
- `src/verify/verify.ts:3` `verifyCollision` — "No attack imports. A separate recomputation gates
  every collision/preimage display."
- `src/math/birthday.ts:1` `birthday(N, q)` — exact collision probability plus bounds.
- `src/worker/tasks.ts:3` `run(name, args, progress)` dispatches named tasks to
  `src/worker/compute.worker.ts`.
- Tests: `src/hash/core.test.ts:21` pins the NIST CAVP SHA-256 LongMsg Len = 1304 record (163
  bytes — multi-block); `e2e/claims.spec.ts` (tests at lines 5–12); `scripts/mutations.mjs` +
  `scripts/mutations.json` (11 concrete-patch mutations: file, unique anchor, replacement, test).
- Scope statements that this extension changes:
  - `src/main.ts:4`, inside "Primary sources and limits": "Parallel distinguished points,
    multicollisions and Merkle–Damgård second-preimage attacks are not implemented."
  - `brief.md:40` and `:136` list Merkle–Damgård multicollisions as a non-goal.

## What to add

**Tab 7 — "Multicollisions" (eyebrow "07 / ONE COLLISION, THEN ANOTHER, THEN 2^b").**

1. **A toy Merkle–Damgård hash.** Compression function
   `h1(cv, m) = truncate(fullHash("h1|" + cv + "|" + m), n1)` on an n1-bit chaining value, IV 0,
   and a final padding block encoding the block count (the book's PB: "must contain an encoding of
   the input message length"). Show it is an honest MD hash: the book's Theorem 8.3 still holds for
   it, and nothing on this tab contradicts that theorem.
2. **Chain b collisions.** At t0 find blocks m0 ≠ m0′ with h1(t0, m0) = h1(t0, m0′) using
   `floydMap` with `f(x) = "blk:" + h1(cv, x)`; set t1 = h1(t0, m0); repeat b times. Show the
   chain as b "forks".
3. **Collect 2^b messages for b collisions' work.** Enumerate every choice of one block per fork,
   and verify all 2^b messages hash to the same H1 value (the verifier recomputes each). The
   headline mechanism, shown: swapping a block inside a fork does not change the next chaining
   value, so nothing downstream moves.
4. **Concatenation is not addition.** H12(M) = H1(M) ‖ H2(M), 2n bits when n1 = n2 = n. H2 is a
   second toy MD hash with a different tag (the book's setting: "Let H1 and H2 be
   Merkle-Damgård hash functions"). Build an H1-multicollision of size 2^b with b ≈ n2/2 (plus one
   or two extra forks; print `birthday(2^n2, 2^b)` as the predicted chance of an H2 collision
   among them), then search that set for an H2 collision. The result collides under both, hence
   under H12. Measure the total in **compression-function calls** and set it beside the naive
   birthday cost on 2n bits.
   Toggle: H2 = Hash Hunt's existing non-iterated `hash(M, n2)` of the whole message. The book's
   argument only uses H1's iterated structure ("by the birthday paradox it is likely that two of
   these messages … are also a collision for H2"), so the attack still works. Before printing a
   general sentence about which hash must be iterated, check Joux 2004's own wording; the book
   states the setting with both hashes Merkle–Damgård.
5. **What it is not.** In-page lines: second-preimage attacks (Kelsey–Schneier) remain out of
   scope; real SHA-256 is not attacked; the forks cost real collision searches on a truncated
   compression function.

Break-it-yourself: the learner picks n (8–24 within the calibrated cap) and b, runs the chain,
then flips any fork in the displayed message and watches H1 stay put — and H2 change.

## Why it belongs here and not in a new lab

Joux's attack is a generic attack built from exactly the birthday/Floyd collision finder this lab
already runs. It reuses `floydMap`, `counted`, `birthday` and the verifier pattern, it was named
as a deliberate non-goal in this lab's own brief, and lifting it completes the lab's subject
(attacks priced by output length and structure) rather than starting a new one.

## SECURITY / CORRECTNESS INVARIANTS

1. Every fork is verified by the independent verifier (no attack imports): h1(t_i, m_i) =
   h1(t_i, m_i′) and m_i ≠ m_i′, recomputed from `fullHash`.
2. Every one of the 2^b enumerated messages is recomputed under H1 before "2^b messages, one
   digest" is displayed (cap b so 2^b ≤ 4,096 for the enumeration display; larger b shows a
   verified sample and the count, labelled).
3. The final H12 collision is verified under H1 **and** H2 by recomputation, with the two messages
   distinct.
4. All costs are counted in compression-function calls through one counter; the displayed total is
   the sum of the displayed parts (H1 stages + H2 evaluations).
5. The naive comparison is run live only when its expected cost fits the existing `counted` budget
   (2,000,000 / 15 s); above that it is **extrapolated** from `calibrate()`'s measured rate and
   labelled an extrapolation.
6. `truncate`'s 1–24-bit limit stands; this tab does not widen it.
7. No canned verdicts — each rendered verdict gets a mutation in `scripts/mutations.json`.

## ARCHITECTURE

```
src/md/toyMd.ts         h1/h2 compression on top of fullHash + truncate; MD iteration with the
                        length block; no attack code
src/attack/joux.ts      chainCollisions(n, b) via floydMap; enumerate(pairs); cascade(n1, n2, b)
src/verify/verify.ts    add verifyFork, verifyMulticollision, verifyCascade beside the existing
                        functions (same "no attack imports" rule)
src/worker/tasks.ts     add 'multicollision' and 'cascade' task names to run()
src/main.ts             append { id: 'multi', label: 'Multicollisions', render: multiPanel } to the
                        mount(...) exhibits array; edit the :4 limits sentence (below)
```

Reuse, do not fork: `floydMap`, `counted`, `calibrate`, `birthday`, `Runner`, `retirement`, `verdict`.

## UI

Controls: n (bits, within the calibrated cap), b (forks), H2 mode (iterated / whole-message).
Buttons: "Build the forks", "Enumerate", "Find an H1‖H2 collision", "Cancel". Output: the fork
strip, a table of the enumerated messages with their shared H1 digest, the final pair with both
digests, a cost table (stage calls, H2 calls, total, naive measured or extrapolated, ratio).

## VISUAL SEMANTICS

A found H12 collision is **ALARM**: a 2n-bit concatenation broke at roughly b·2^(n/2) work.
Enumerated messages sharing one digest read as a collision set, not as "verified OK". An
extrapolated naive cost carries an "extrapolated, not run" label. Icon + text + colour.

## EDGE CASES

- b larger than the enumeration cap → sample shown, count stated, no claim that all were displayed.
- n outside the calibrated cap or 1–24 → refused with the cap, as the existing tabs do.
- No H2 collision among 2^b messages (possible; probability printed) → "no collision this run —
  add a fork or rerun"; nothing claimed.
- Budget exhausted mid-fork → the forks already found stay listed; no multicollision claimed.
- Switching tab / changing n, b or mode → existing `retirement` retires the verdict and says so.

## Tests

- KATs: reuse `core.test.ts:21`'s multi-block CAVP record (it covers the SHA-256 under h1/h2).
  Add a Vitest test recomputing h1 with `node:crypto` `createHash('sha256')` (core.test.ts already
  imports it) on random inputs — an independent implementation of the toy compression function.
- Vitest: for random seeds, every enumerated message has the same H1; the cascade pair collides
  under H1 and H2 and is distinct; cost parts sum to the total.
- `e2e/claims.spec.ts` (§4.1b): parse the displayed fork blocks and recompute each fork's
  collision in the test with its own SHA-256 (not imported from src); parse two random enumerated
  messages and recompute H1; parse the final pair and recompute H1 and H2; assert displayed total
  = displayed stage calls + H2 calls; assert the extrapolated naive figure equals the stated
  expected evaluations / displayed rate.
- §4.1c, added to `scripts/mutations.json` in its existing format: wrong chaining value for the
  next fork (reuse t_i); enumeration flips the wrong fork bit; H2 check skipped in cascade; length
  block omitted from MD; cost counter skips H2 calls; naive cost exponent uses (n1+n2) instead of
  (n1+n2)/2.
- §4.1d negative claim — scoped to this tab: **"Concatenating these two hashes does not double the
  collision work: a 2n-bit H1‖H2 here falls to about b·2^(n/2) compression calls with b ≈ n/2
  forks"** (the book's O(n·2^(n/2))). Evidence fixture: every check green — each fork verified,
  every multicollision message verified, the final pair verified under both hashes and distinct,
  length block present — and the measured total sits far below the naive 2n-bit cost. Verdict
  text: `2n-BIT DIGEST — b·2^(n/2) WORK`.

Reproduction note (not for the page): the brief author's prototype with n1 = n2 = 16 found the
H12 collision on its first try with b = 8, 9 and 10, spending about 2,400–3,600 compression calls
on the forks, against roughly 82,000 evaluations expected for a naive 32-bit birthday search.

## README and card follow-up

- README §5: "What It Is" gains one sentence on multicollisions; the Exhibits list gains
  "6. **Multicollisions:** chained compression collisions, 2^b same-digest messages, and an
  H1‖H2 collision measured against the naive cost." "What Can Go Wrong" gains the second-preimage
  non-goal.
- Propagation: change `src/main.ts:4` to "Parallel distinguished points and Merkle–Damgård
  second-preimage attacks are not implemented; multicollisions are tab 7." Leave `brief.md`
  unchanged (it records the original scope) and say so in the commit message.
- Catalog handoff (do not edit ../crypto-lab): card copy may add "multicollisions"; chips gain
  nothing new as primitives (SHA-256 already present); concept-coverage: deepens the
  collision-resistance concept.

## Do not touch

The five existing tabs' behaviour and eyebrows, the CAVP vector, the 1–24-bit truncation limit,
the calibration logic, the mutation runner script, the theme pin and the header.

## Sources

- D. Boneh, V. Shoup, *A Graduate Course in Applied Cryptography*, v0.6, Jan. 2023 —
  https://toc.cryptobook.us/. §8.4 (Merkle–Damgård, padding block PB, Theorem 8.3), §8.4.1 (s-collisions
  in O((log₂ s)·|X|^(1/2)); H12 collisions in O(n·2^(n/2))).
- A. Joux, "Multicollisions in Iterated Hash Functions. Application to Cascaded Constructions",
  CRYPTO 2004, LNCS 3152, pp. 306–316 — doi:10.1007/978-3-540-28628-8_19 (Crossref-verified).
- J. Kelsey, B. Schneier, "Second Preimages on n-bit Hash Functions for Much Less than 2^n Work",
  IACR ePrint 2004/304 — https://eprint.iacr.org/2004/304 (cited only as the non-goal; the
  EUROCRYPT 2005, LNCS 3494, pp. 474–490 venue comes from the eHash bibliography —
  [UNVERIFIED against the publisher — check before use]).
