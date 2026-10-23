# Hash Hunt

Generic hash attacks · birthday · Floyd · time–memory tradeoffs

## What It Is

A browser laboratory that deliberately shortens SHA-256, then runs real generic attacks on the shortened output. Find collisions, produce meaningfully different colliding letters, transfer a real HMAC tag between them, and compare exhaustive search, full lookup, Hellman chains and rainbow chains. A length-strengthened toy Merkle–Damgård construction then chains real compression collisions into 2^b messages and applies Joux’s attack to H1‖H2. A separate exhibit measures hash-table flooding with chosen inputs and a secret keyed mapping. This is a teaching demo, not production cryptography, and it does not attack full SHA-256.

Built to the [Crypto Lab master template](https://github.com/systemslibrarian/crypto-lab/blob/main/audits/_MASTER-TEMPLATE.md). The original brief is included. Shared fleet UI and accessibility machinery derives from MIT-licensed work by Paul Clark.

## Exhibits

1. **Birthday room:** fresh hash trials, an exact uniform-output probability model, and explicitly range-limited bounds.
2. **Collision hunt:** a generic collision attack using birthday search or Floyd's two active walk registers; full digests, truncated bits and independent checks.
3. **Meaningful forgery:** two piles or Floyd over an injective letter map. An isolated employer closure signs the dismissal's shortened digest; WebCrypto verifies that tag on the recommendation and rejects a modified tag. Word choices are highlighted; Floyd exposes recorded walk steps.
4. **Chained tables:** actual Hellman/rainbow reductions, endpoint storage, regeneration, false alarms, coverage, online costs and reachable-target hit rates.
5. **Salt experiment:** precompute before drawing fresh salts; distinguish bucket matches, verified preimages, and original passwords.
6. **Multicollisions:** chained compression collisions, 2^b same-digest messages, and an H1‖H2 collision measured against the naive cost.
7. **Hash-table flood:** search distinct names that start in one public bucket, insert them by linear probing, then compare slot visits for the same names under a fresh secret HMAC-SHA-256 mapping. This is a table attack, not a cryptographic digest collision or an implementation of SipHash.

## When to Use It

Teach generic attack costs and the limits of composition. This attacks tiny output spaces, not full SHA-256 or HMAC. Full SHA-256's approximately 2^128 generic collision scale is a formula only.

## Live Demo

[Hash Hunt](https://systemslibrarian.github.io/crypto-lab-hash-hunt/). Build collision forks, enumerate their messages, flip one fork, and compare a measured H1‖H2 break with the naive 2n-bit birthday cost. Publication follows the complete correctness, browser, accessibility and mutation gate.

## What Can Go Wrong

- A valid tag over a collision-prone digest does not establish which letter was approved.
- Two active Floyd registers exclude seeds, hash state, counters and diagnostics.
- Full lookup covers reachable digests, not all outputs. H(x) targets differ from uniform output targets.
- Hellman's roughly 0.63 model requires the stated parameter relation and heuristic independence. Rainbow's recurrence is a random-function model, not a measured success rate.
- Matching endpoints still require regeneration and verification. Diagnostic coverage/merge sets consume extra temporary memory.
- Salts prevent mapping reuse, not per-user guessing. At 12 bits, accidental valid table answers and multiple preimages are possible.
- Joux multicollisions are not second-preimage attacks. Kelsey–Schneier long-message second-preimage techniques remain out of scope, and no result on this page breaks real SHA-256.
- A public, unkeyed mapping lets an adversary search for colliding table buckets offline. Here the measured cost is the number of table slots inspected during insertion, not SHA-256 collision work. The keyed HMAC comparison is a toy countermeasure illustration, not a benchmark or proof that every server resists denial of service. The selected names, table size and probing algorithm are identical between runs; only the bucket mapping changes. See [Rust's current `HashMap` documentation](https://doc.rust-lang.org/std/collections/struct.HashMap.html) and [Aumasson and Bernstein's SipHash paper (2012)](https://www.aumasson.jp/siphash/siphash.pdf).
- Runtime caps may stop a search. Input changes retire old results; cancellation terminates the worker. Bounded fallback can occupy the main thread if workers cannot be created.

## Real-World Usage

The birthday principle motivates hash lengths. Time–memory tradeoffs explain historical password precomputation, while salts and expensive password hashing address different costs. A shortened hash before a MAC can defeat an otherwise sound MAC construction. Separately, keyed short-input hashing in hash tables makes offline bucket targeting difficult when applications accept attacker-chosen keys; Rust currently documents SipHash 1-3 as its default and explicitly says this default may change.

Primary references: Katz–Lindell third edition §§6.4, 6.6.3 and Appendix A.4; [Boneh–Shoup v0.6 §8.4](https://toc.cryptobook.us/book.pdf); [Joux (CRYPTO 2004)](https://doi.org/10.1007/978-3-540-28628-8_19); [Hellman (1980)](https://www-ee.stanford.edu/~hellman/publications/36.pdf); [Avoine, Junod and Oechslin](https://crypto.junod.info/jacm08.pdf); [Yuval (1979)](https://doi.org/10.1080/0161-117991854025); [FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final); [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231.html).

## How to Run Locally

Node 22 or newer:

```sh
npm ci
npm run dev
```

## Related Demos

[Collision Vault](https://systemslibrarian.github.io/crypto-lab-collision-vault/), [Babel Hash](https://systemslibrarian.github.io/crypto-lab-babel-hash/), [Bcrypt Forge](https://systemslibrarian.github.io/crypto-lab-bcrypt-forge/), [KDF Arena](https://systemslibrarian.github.io/crypto-lab-kdf-arena/), [Log Forge](https://systemslibrarian.github.io/crypto-lab-log-forge/).

Source review used the sibling commits pinned in the brief. Bcrypt Forge has a full dictionary map described as rainbow precomputation; this lab adds actual column-dependent rainbow chains. Cryptanalytic collisions and length extension remain separate demos.

## Build & Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:mutations
```

37 executed unit cases cover SHA-256, all truncation widths, RFC 4231's long-key/long-data HMAC example, Floyd predecessors, independently checked collisions, meaningful methods, chain inversion, salt timing, complete and sampled Joux fork enumeration, both H2 cascade modes, exact call accounting, import boundaries, and hash-table probes. The flood tests recheck HMAC bucket starts independently with Node's HMAC and count wraparound in linear probing. The exact 163-byte NIST CAVP LongMsg fixture and provenance are in `src/hash/sha256-longmsg-1304.json`. The official ZIP was inaccessible locally; a preserved NIST response file from TclTLS was independently checked with platform SHA-256. No current-ZIP comparison or coverage percentage is claimed.

Twenty-three browser claims use Node SHA-256 to recheck displayed inputs, recovered preimages, every fork transition, sampled multicollision messages, both H2 modes, the final H1‖H2 pair, cost sums and extrapolation. The hash-table claim checks that 24 public collisions cost 300 slot visits and the displayed first eight rows show the expected growing probes. Twenty-four mutations must pass baseline, build, move bundle bytes, fail a named test, restore, and pass again. Accessibility exercises every multicollision state and the hash-table panel at 1280/320 pixels with the unchanged fleet contrast/non-text oracles. Browser QA runs in CI when supported local browser control is unavailable.

Pages, PRs and grouped Dependabot auto-merge use the entire gate; automated merges explicitly dispatch deployment.

## Performance

A measured hash calibration sets a 12–24-bit interaction cap. Searches also enforce time/evaluation limits; letter hashes can be slower. Counts exclude independent verification. Multicollision costs count each H1 compression and H2 evaluation, while naive work above the two-million-call budget is explicitly extrapolated from the measured rate. Chain construction is capped at one million hashes. Timings describe this browser, not production-size SHA-256.

The Crypto Lab catalog integration records this lab’s concept, level, source evidence and fleet automation. Playwright port 4225 is unique across all 223 registered configurations; strictPort is enforced and existing servers are never reused.

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*

### Multicollision correction

Choosing a fork to inspect no longer retires the chain; every fork remains flippable.
The table prints choices in stage order, matching the displayed blocks. New searches
retire the previous chain immediately. Independent verification now binds each fork
to its predecessor and each message to its stated mask, and checks complete-set counts.
Mutation replay reads structured test results and rejects crashes or setup failures.

Cancellation in degraded mode is checked before computation starts and on every
progress update or error, so a retired run cannot replace a newer result.

## Deviations from the brief

- **HH-2: retain the hardened mutation runner.** Restoring the base text-search runner would allow a timeout, crash or setup error to masquerade as a kill. The current structured-report validation remains. The repair also clears generated output and captures the baseline bundle hash immediately after an explicit clean build; browser artifact collection had left stale mutant chunks beside the active bundle. A kill still requires the named assertion to fail, a changed successful build, restoration to the original build hash and a passing restored test.
- **HH-12: salted hits are measured, not forced to zero.** A twelve-bit table can accidentally return a valid salted preimage. The visible “TABLE USELESS FOR THIS BATCH” appears only when every table candidate fails verification; the recovery experiment reports the actual count. Under an ideal independent random-function model, a domain of N=4096 with M=2624 stored unsalted outputs has per-user accidental-success probability M(2N−1)/N³. The resulting probability of at least one hit among 20 users is about 0.624%, rather than the audit summary's 0.3%. The extra contribution comes from the table candidate sometimes being the originally sampled password. This is a model calculation, not a guaranteed or measured frequency.
- **Existing accessibility oracles were not weakened.** The audit's condensed files retained the contrast/non-text algorithms. The full reference structure and comments are restored, and missing structural boot assertions now check list semantics, one main landmark, seven tabs, the skip-link destination, default inputs, closed disclosures and absence of theme controls. The lab-specific state driver remains adapted to Hash Hunt.

## Audit repair evidence

HH-1 now has both a genuine same-type eight-bit collision control and a deterministic Floyd run with four actual same-type retries before the cross-type forgery. The page logs the rejected letter pairs, and browser tests hash those letters with Node SHA-256. Separate mutations bypass the semantic verifier and the retry step.

The salt-timing test exercises the real inline fallback and observes the actual CSPRNG calls. Each salt must be drawn after the real table-build completion callback. A mutation creates the targets before construction, and must fail that test; this is distinct from the existing invalid-bucket-answer mutation. Table construction still has no access to salts. The experiment uses the full lookup table as described on the page.

The full lookup is named Bcrypt Forge’s Scenario B; Hash Zoo, DNSSEC Chain, Feistel Forge and Grover have framed links. Non-byte-aligned controls expose the final-byte mask and measured cap. Explicit Hellman/rainbow start-point fixtures confirm that an index is not accepted as a preimage merely because it is a stored start.

Counts are obtained with `npx vitest list --json`, `npm test` (which expands parameter rows to 37), `npx playwright test --list` (23 claims plus two accessibility drives), and the 24-entry `scripts/mutations.json`. No tests are skipped. Local browser runs can select an installed Chromium with `CHROMIUM_PATH`; the registered port, deployment workflow, header and theme pin are unchanged.

Mutation restoration hashes the JavaScript files listed by each fresh Vite build manifest. Unreferenced files left by browser artifact collection are excluded; baseline, mutant and restored builds still have to satisfy every assertion and hash check.
