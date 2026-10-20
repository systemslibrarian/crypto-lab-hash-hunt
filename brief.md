# Build brief — `crypto-lab-hash-hunt`

**2026-10-20. Brief only; no repository exists yet.** Written against
`audits/_MASTER-TEMPLATE.md` (catalog `f48d9d2f2f06`) — §0 through §6 apply unchanged.
Source of the gap: Katz–Lindell, *Introduction to Modern Cryptography*, 3rd ed., §6.4.1–6.4.3,
Appendix A.4 and §6.6.3.

**Verdict: new repository.**

```
NEW DEMO BRIEF
- Repo name:         crypto-lab-hash-hunt
- Short name (H1):   Hash Hunt
- Subtitle:          Generic hash attacks · birthday · rho · time–memory tradeoffs
- One-liner:         Finds real collisions and preimages in SHA-256 truncated to t bits:
                     a birthday search with a table, the same search in constant memory with
                     Floyd's cycle finder, a meaningful two-letter collision, and Hellman and
                     rainbow tables, each measured against its formula.
- Concept to teach:  Output length alone prices the attacks that work on EVERY hash. About
                     2^(t/2) evaluations find a collision, so collision resistance needs twice
                     the bits of key security. Precomputation buys fast inversion, and a
                     per-user salt takes that precomputation away.
- Primitives/spec:   SHA-256 (FIPS 180-4) via @noble/hashes, truncated to its leading t bits;
                     HMAC-SHA-256 (WebCrypto) for the hash-and-MAC forgery. Methods: K-L
                     §6.4.1 (birthday), §6.4.2 (Algorithm 6.9, small-space birthday; meaningful
                     collisions), §6.4.3 (Hellman time/space tradeoff), App. A.4 (Lemma A.15);
                     Yuval 1979; Hellman 1980; Oechslin 2003 (rainbow tables)
- Accent (--accent): [central assignment]
- Favicon emoji:     [central assignment]
- Category:          [central assignment]
- Section (suggested): cryptanalysis      Level (suggested): Intermediate
- In scope:          measured birthday probability on truncated-SHA-256 values; table-based
                     collision search on H_t; Floyd constant-memory search (K-L Alg. 6.9);
                     Yuval meaningful collision by both K-L methods (two piles; the g/f map with
                     Floyd); a real HMAC tag that verifies on the letter it was never computed
                     over; full lookup table vs Hellman tables vs rainbow tables inverting H_t,
                     with coverage, merges and false alarms measured; a per-user salt toggle
- Non-goals:         cryptanalytic (non-generic) collisions such as MD5/SHA-1; length extension;
                     parallel collision search with distinguished points; quantum collision
                     search; multicollision and second-preimage attacks on Merkle–Damgård;
                     password-hashing cost functions (bcrypt, scrypt, Argon2)
```

## Overlap check — what I read, and what I found

Opened from source, at the commits shown.

- **Collision Vault** (`dd7066fc8275`) verifies published MD5/SHA-1 collision pairs and a
  reduced-step SHA-256 pair. The generic bound appears only as prose:
  `demos/collision-vault/src/ui/resistancePanel.ts:68` ("about 2^(n/2) work for an n-bit
  digest"). It runs no search of its own. Hash Hunt is where that sentence gets run.
- **Babel Hash** (`6052e310cb8a`, `demos/babel-hash/src/`) covers avalanche, length extension and
  HMAC. Searching for `birthday|truncat` finds only a quantum-security table row
  (`main.ts:827`). No collision search.
- **Hash Zoo** (`c604e5c6bb20`) covers construction internals and avalanche, plus reduced-round
  research notes (`src/ui.ts:395–406`, which links to Collision Vault). No collision search.
- **Bcrypt Forge** (`16fc3193fe11`). `src/exhibits.ts:1014` is headed "Scenario B — a REAL
  rainbow table", but `initScenarioB` MD5s every entry of `COMMON_PASSWORDS` into a
  digest → plaintext map and looks digests up (`:1016–1018`; `src/lib.ts:65` says the same). That
  is K-L §6.4.3's *trivial* preprocessing: a full table, Θ(|D|) memory, no chains. It is not a
  Hellman or rainbow table. A separate extension brief in this batch relabels it and links here.
  Act 5 below shows the full table next to the real chained ones, so the difference is visible
  rather than asserted.
- **KDF Arena** (`5c7fc3905dc9`) has a "Reuse salt across runs" toggle (`src/main.ts:84`, `:183`)
  that reproduces identical derived keys, with a salt callout naming rainbow tables
  (`src/ui.ts:251–262`). It builds no table. Act 6 is the experiment behind that callout.
- **Feistel Forge** (`ed001a6cabae`) runs the birthday problem on 64-bit cipher blocks
  (`src/ui/sweet32Panel.ts:77–108`). Same mathematics, different object (ciphertext blocks, not
  digests). Link it; don't repeat it.
- **DNSSEC Chain** (`fe881bdcdc99`) runs a real offline dictionary attack on NSEC3 hashes
  (`src/attack/dictionary.ts`). Its salt note (`src/ui/panels/nsec3.ts:321`) says the salt defeats
  a table computed in advance but not per-target guessing. Hash Hunt's salt act must agree with
  that, and it does: salt removes *precomputation*, not *guessing*.
- **Grover** (`b7289773147c`) tabulates the quantum (BHT) collision bound
  (`src/main.ts:1452`, `:1553`). Out of scope here; link it.
- **Factor Forge** (`8fd7436210e0`). *Correction to the brief that commissioned this one:* its rho
  uses **Brent's** cycle detection, not Floyd's (`src/factor/rho.ts:2–14`, "Brent's variant
  replaces Floyd's two-pointer walk"). Hash Hunt is where Floyd's two-pointer walk is shown, and
  the README should say both labs solve the same cycle-finding problem with different finders.

Before building, grep the sibling clones again for `birthday|rainbow|hellman|floyd|yuval` and
report anything new since these commits (kickoff.md overlap rule).

## SCOPE

0. **What is this.** A plain-language intro, no maths. A fingerprint has a fixed number of bits.
   Some attacks need nothing about *how* the fingerprint is made, only how long it is. This lab
   shrinks SHA-256's output so those attacks finish while you watch.
1. **The birthday room, in bits.** Draw q real values H_t(0), H_t(1), …, and plot the measured
   collision rate over many runs against the exact ∏(1 − i/N) and K-L Lemma A.15's bounds
   q(q−1)/4N ≤ … ≤ q(q−1)/2N. The 23-people/365-days case is the opening preset.
2. **Collision with a table** (§6.4.1). Slide t. "Hunt" hashes distinct inputs until two agree.
   Live readouts: evaluations so far, entries stored, and the 2^(t/2) line. On success, show both
   inputs, both truncated digests (equal) and both full 256-bit digests (different).
3. **Collision in constant memory** (§6.4.2, Algorithm 6.9). Same H_t, same t. Tortoise and hare
   step through x_i = H_t^(i)(x_0) and x_2i, then the second loop finds the first repeat. Draw the
   rho shape from the measured tail and cycle lengths. Side by side with Act 2: time about the
   same, memory two values against about 2^(t/2).
4. **A meaningful collision, then a forged tag** (§6.4.1 "Finding meaningful collisions", §6.4.2
   same heading; Yuval 1979).
   - Two letters, one firing Alice and one recommending her. Each has at least `T_MAX − 1`
     binary variation points ("hard/difficult", "great/super").
   - Method A, two piles: generate variants of both letters and match across the piles.
   - Method B, K-L's construction: g maps a t-bit string to a letter (first bit = letter type,
     the rest = word choices); Floyd runs on f(x) = H_t(g(x)). A collision lands on different
     letter types about half the time (K-L §6.4.2). Count and show the same-type retries.
   - Then the stakes (K-L's own motivation): the employer computes a real WebCrypto
     HMAC-SHA-256 tag over H_t of the letter Alice submits, the firing letter. That tag
     verifies on the recommendation letter.
   - Beside it, the full-SHA-256 version of the same search as a cost line only: 2^128,
     labelled as a formula.
5. **Inverting: no table, full table, Hellman, rainbow** (§6.4.3; Oechslin 2003). Domain
   {0,1}^t, with t set by measurement and likely 16–24.
   - (a) Exhaustive search: Θ(N) online.
   - (b) Full table: Θ(N) memory, Θ(1) online. This is Bcrypt Forge's Scenario B, named as such.
   - (c) Hellman: s starts × t_c steps per table, st_c² = N/2, T = 4t_c tables (K-L's parameter
     choice and its ≈ 1 − e⁻¹ ≈ 0.63 coverage estimate).
   - (d) Rainbow: one reduction function per column.
   - For each, show precomputation evaluations, stored entries, online evaluations, chain merges
     (Hellman merges anywhere; rainbow only when two chains meet in the same column) and false
     alarms. Show measured success over a batch of random targets against the prediction:
     K-L's bound for Hellman, Oechslin's recurrence for rainbow.
   - Then K-L's "different domain and range" variant: reduction functions map into a small
     password space D (for example 4–5 lowercase letters).
6. **Salt.** Turn on a per-user salt drawn with `crypto.getRandomValues` *after* the table was
   built, and store H(s‖pw). The prebuilt table's hit rate drops to its measured value (zero
   expected). Then run per-user exhaustive search over D and recover the password anyway.
   Salt defeats precomputation, not guessing (K-L §6.6.3). Then link Bcrypt Forge and KDF
   Arena for the other mitigation, slow hashes.

Non-goal notes, one line each in-page:
- MD5/SHA-1 real collisions → Collision Vault.
- Length extension → Babel Hash.
- Distinguished points and parallel search → "future extension".
- Quantum collision search → Grover.
- Merkle–Damgård-specific multicollision and second-preimage attacks → "not shown here".
- Slow password hashes → Bcrypt Forge, KDF Arena.

## SECURITY / CORRECTNESS INVARIANTS

1. **Nothing is displayed until it is verified.** A collision is shown only after
   `src/verify/verify.ts` recomputes H_t on both inputs and confirms they are distinct. A preimage
   is shown only after it confirms H_t(x′) = y. The verifier imports no attack module. Copy the
   mechanism from Factor Forge, `src/verify/verify.test.ts:52` ("the verifier imports no
   algorithm module"). Note that its `verify.ts:8` comment names a `verify.import-isolation.test.ts`
   that does not exist; the check lives in `verify.test.ts`.
2. **Truncation is defined once:** the leading t bits of the 32-byte digest, MSB-first, with the
   low bits of the last partial byte masked. A test checks it against an independent BigInt
   right-shift of the full digest.
3. **Counts are counts.** Every "evaluations" number comes from a counter wrapped around the hash
   call. No count on screen is computed from a formula. Formula values are labelled "predicted",
   in text, not by colour alone.
4. **Probabilistic results are shown as distributions over runs,** never as guarantees and never
   as a single lucky run (kickoff.md hard rule).
5. **Floyd starts outside the range.** K-L's Algorithm 6.9 draws x_0 from {0,1}^(ℓ+1), so x_0 can
   never equal x_i. Encode x_0 so it cannot be an H_t output, and test that.
6. **The salt is unknown to the precomputation.** Salts are generated after the table exists.
   The table module has no access to them, enforced by module boundary and a test.
7. **The attacker never holds the HMAC key.** The forgery panel calls the real
   `crypto.subtle.verify`. The key lives in the "employer" module, and the attack module imports
   only the tag.
8. **Caps come from measurement in the browser** (as Factor Forge caps N). Nothing extrapolated
   is labelled measured.
9. **No collision is claimed for SHA-256 itself.** Full digests are always displayed and differ.

## ARCHITECTURE

```
src/hash/truncate.ts        H_t over @noble/hashes sha256; instrumented counter
src/math/birthday.ts        exact ∏(1−i/N) in log space; Lemma A.15 bounds
src/attack/birthday.ts      table search (Map keyed by truncated value)
src/attack/floyd.ts         K-L Algorithm 6.9, returns {x, x′, tail, cycle, evals}
src/attack/meaningful.ts    letter templates, g(), f = H_t∘g, two-piles and Floyd variants
src/attack/tmto/{reduce,hellman,rainbow,fulltable}.ts
src/mac/hashAndMac.ts       WebCrypto HMAC-SHA-256 over H_t(m) — employer side only
src/verify/verify.ts        independent recomputation; imports no attack module
src/worker/                 long runs off-thread with a cancellation id
src/ui/                     one module per act
```

**Library choice: `@noble/hashes`, not WebCrypto, for the attack loops.** Floyd and Hellman
chains are strictly sequential, H(H(…)). WebCrypto `digest` is async, so each step would be an
awaited promise.

Measured on this side, in Node 22 (not a browser): about 4.4×10⁵ SHA-256 evaluations/s with
noble on 8-byte inputs, against about 3.3×10⁴ sequentially awaited WebCrypto digests/s. The agent
must re-measure in the browser and set every cap from that.

`@noble/hashes` (^2.4.0) is already a dependency of Collision Vault, Hash Zoo and Babel Hash at
the commits above. HMAC stays on WebCrypto, because the forgery must be checked by the platform
verifier, not by the lab's own code.

Workers: copy Function Key's cancellation rule and visible degraded fallback
(`crypto-lab-function-key/src/ui/search.ts:1–15`, at `5d3d445b0073`). A stale answer must never
render beside new inputs.

## UI

- One t slider shared by Acts 2–4.
- A "Hunt" button with a live evaluations counter and a memory meter. Act 2 shows entries
  stored; Act 3 shows two registers.
- The rho diagram is drawn from the measured tail length λ and cycle length μ, never as a
  stock picture.
- Act 4 renders both letters with the chosen words highlighted, both truncated digests aligned
  bit for bit, then the employer's tag and the verify result.
- Act 5 is a table-builder with s, t_c and T inputs (defaulting to K-L's st_c² = N/2, T = 4t_c),
  a chain viewer (start → … → end, merges marked), and a batch-inversion run. The batch reports
  hits, misses, false alarms and online evaluations against the predicted success.
- Act 6 adds a salt switch and re-runs Act 5's batch against salted targets.
- Stacks below 640px. Every long run is cancellable.

## VISUAL SEMANTICS

- **Colour tracks the hash's integrity, not "the button worked".** A found collision reads as
  **ALARM** ("COLLISION — H_t broken at t = 32"), with icon and text as well as colour.
- The forged letter reads **"TAG VALID — AND FORGED"**: the real verifier says yes, and the
  page says why that is bad.
- A salted-table miss reads as protection working ("TABLE USELESS").
- A recovered salted password reads as ALARM again, because guessing still worked.
- Predicted and measured series differ by line style *and* label (WCAG 1.4.1). Check in
  grayscale and deuteranopia.
- Never draw a smooth curve where the data are discrete runs; plot points.

## EDGE CASES

| Input | Behaviour |
|---|---|
| t outside [T_MIN, T_MAX] | clamped. Tooltip names the measured cap and why it exists |
| t not a multiple of 8 | low bits masked; tooltip shows the mask |
| Floyd start equal to a range value | impossible by encoding (invariant 5); test asserts |
| x = x′ reported | rejected by the verifier; never displayed |
| same-type meaningful collision | counted as a retry, shown in the log, search continues |
| Hellman match that is a false alarm | counted and shown as a false alarm, never as a hit |
| target equals a stored start point | handled (preimage is the predecessor, or report "start point, no preimage in chain") |
| st_c² > N chosen by hand | warning: past K-L's useful-coverage point (§6.4.3) |
| worker unavailable | runs inline with a visible "degraded" notice |
| input changed mid-run | run cancelled; old verdict retired with "retired: inputs changed" |

## EXTENSION SEAMS

- `// [extension] point` in `src/attack/floyd.ts`: distinguished points and parallel collision
  search (van Oorschot–Wiener 1999).
- `// [extension] point` in `src/attack/tmto/hellman.ts`: Hellman's original key-recovery use,
  inverting k ↦ F_k(m) for a toy block cipher (K-L §6.4.3, last paragraph).
- `// [extension] point` in `src/math/birthday.ts`: multi-target preimage search.

## Tests

**KATs.** Every block or keyed primitive gets at least one vector longer than one 64-byte block.

- SHA-256, from NIST CSRC "Example Values" `SHA256.pdf`: "abc" →
  `ba7816bf…f20015ad`, and the 448-bit two-block message → `248d6a61…19db06c1`. Both were checked
  against that PDF.
- SHA-256 with a **message longer than 64 bytes**: at least one entry from NIST CAVP
  `shabytetestvectors.zip` (SHA256LongMsg). The agent fetches and pins it with its file name and
  record. Optionally add 1,000,000 × "a" →
  `cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0`, which was recomputed here
  with Python `hashlib`. Its attribution to FIPS 180-2 Appendix B.3 was **not** confirmed in this
  session, so do not cite FIPS for it unless the agent confirms it.
- HMAC-SHA-256: RFC 4231 §4.8 Test Case 7 (131-byte key, 152-byte data) →
  `9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2`. Checked against the RFC
  text and recomputed with Python `hmac`.

**Unit tests (Vitest):**
- truncation against the BigInt shift;
- Floyd on a hand-built map with known λ and μ;
- the exact birthday product equals 1 − ∏ computed independently, with the 23/365 case as a
  fixture;
- Oechslin's recurrence against a seeded, exhaustively counted small table, with tolerance stated;
- the salt module boundary (invariant 6);
- the verifier import list (invariant 1).

**`e2e/claims.spec.ts` (§4.1b), independent re-derivations:**
- parse both colliding inputs off the page and recompute SHA-256 with `node:crypto`, a different
  route than noble, then compare the leading t bits;
- parse the displayed evaluation count and table size and check stored entries ≤ evaluations;
- Floyd: the memory readout is 2, and evaluations are consistent with the displayed λ and μ;
- forgery: recompute HMAC with `node:crypto` from the key exported by a test-only hook. If no
  hook is wanted, instead assert that the tag shown is the one bound to the *other* letter;
- batch inversion: hits + misses = targets, and every hit re-verifies;
- retirement on t change, and the no-op guard.

**§4.1c mutations, one per rendered verdict.** Each must turn a NAMED test red, with the
baseline passing, the source diff non-empty and the bundle hash moved:
- compare t−1 bits in the verifier;
- report a same-type meaningful collision as a success;
- render the letter text from the wrong branch of g;
- count false alarms as hits;
- build the Hellman table with the salt known;
- make the forgery panel compute its own MAC instead of calling `crypto.subtle.verify`.

**§4.1d negative claims, each scoped to this construction:**
- **Fixture A, the forged letter.** "A valid HMAC tag over a t-bit hash does not show the key
  holder approved this letter. Hash-and-MAC is only as collision-resistant as the hash it
  MACs." Every check is green: the real HMAC verify returns true, and the verifier confirms equal
  H_t. The text is on screen in that state.
- **Fixture B, salted recovery.** "A salt stops precomputed tables; it does not stop guessing one
  user's password." The table hit rate shows zero, the salt is unique, and exhaustive search
  recovers the password anyway.

## Honesty notes for the page

- Every attack is real, and runs on a truncated SHA-256 that is broken *by construction*. Full
  SHA-256 is not attacked, and its 2^128 and 2^256 lines are formulas.
- Timings are this browser on this machine.
- Hellman's analysis treats H as a random function (K-L §6.4.3), and independence across tables
  "is difficult to argue formally" (K-L). Say so beside the 0.63 prediction.
- Not production crypto. A teaching demo.

## Links out

Collision Vault (real cryptanalytic collisions) · Babel Hash (length extension, HMAC) · Hash Zoo
(how the compression function is built) · Bcrypt Forge (full lookup table; slow hashes) · KDF
Arena (salt reuse) · DNSSEC Chain (published salts, per-target dictionaries) · Feistel Forge
(birthday on 64-bit blocks) · Factor Forge (the same cycle-finding problem, solved with Brent's
method) · Grover (quantum collision bound) · Log Forge, proposed in this batch (Floyd/rho reused
for discrete logs, K-L §10.2.3).

## Sources (verified 2026-10-20)

- J. Katz, Y. Lindell, *Introduction to Modern Cryptography*, 3rd ed., CRC Press, 2021, ISBN
  9780815354369: §6.4.1–6.4.3, §6.6.3, Algorithm 6.9, Lemma A.15. Checked in the book text.
- G. Yuval, "How to Swindle Rabin," *Cryptologia* 3(3):187–189, July 1979. Checked against the
  Cryptologia table of contents at ftp.math.utah.edu/pub/tex/bib/toc/cryptologia.html.
- M. E. Hellman, "A Cryptanalytic Time-Memory Trade-Off," *IEEE Trans. Inf. Theory* IT-26(4):
  401–406, July 1980. Checked against the paper's first page,
  ee.stanford.edu/~hellman/publications/36.pdf.
- P. Oechslin, "Making a Faster Cryptanalytic Time-Memory Trade-Off," CRYPTO 2003, LNCS 2729,
  pp. 617–630, doi:10.1007/978-3-540-45146-4_36. Checked via IACR bibtex and Crossref. The
  rainbow success formula, P = 1 − ∏(1 − m_i/N) with m_1 = m and m_{n+1} = N(1 − e^(−m_n/N)), is
  Eq. 3 in §3, checked in the EPFL PDF.
- P. C. van Oorschot, M. J. Wiener, "Parallel Collision Search with Cryptanalytic Applications,"
  *J. Cryptology* 12(1):1–28, 1999, doi:10.1007/PL00003816. Checked at Springer. Extension seam
  only.
- NIST, FIPS 180-4, *Secure Hash Standard*, 2015, doi:10.6028/NIST.FIPS.180-4. Plus the NIST
  CSRC example values `SHA256.pdf`, checked, and the CAVP `shabytetestvectors.zip`, whose
  location was checked at
  csrc.nist.gov/projects/cryptographic-algorithm-validation-program/secure-hashing.
- RFC 4231, *Identifiers and Test Vectors for HMAC-SHA-224, -256, -384, -512*, §4.8. Checked at
  rfc-editor.org.
- Floyd's cycle-finding algorithm. Attributed to Floyd in K-L's Chapter 6 notes. No primary
  Floyd citation is given, and a Knuth TAOCP attribution was not verified, so it is omitted.
