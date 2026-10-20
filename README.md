# Hash Hunt

Generic hash attacks · birthday · Floyd · time–memory tradeoffs

## What It Is

A browser laboratory that deliberately shortens SHA-256, then runs real generic attacks on the shortened output. Find collisions, produce meaningfully different colliding letters, transfer a real HMAC tag between them, and compare exhaustive search, full lookup, Hellman chains and rainbow chains.

Built to the [Crypto Lab master template](https://github.com/systemslibrarian/crypto-lab/blob/main/audits/_MASTER-TEMPLATE.md). The original brief is included. Shared fleet UI and accessibility machinery derives from MIT-licensed work by Paul Clark.

## Exhibits

1. **Birthday room:** fresh hash trials, an exact uniform-output probability model, and explicitly range-limited bounds.
2. **Collision hunt:** a generic collision attack using birthday search or Floyd's two active walk registers; full digests, truncated bits and independent checks.
3. **Meaningful forgery:** two piles or Floyd over an injective letter map. An isolated employer closure signs the dismissal's shortened digest; WebCrypto verifies that tag on the recommendation and rejects a modified tag. Word choices are highlighted; Floyd exposes recorded walk steps.
4. **Chained tables:** actual Hellman/rainbow reductions, endpoint storage, regeneration, false alarms, coverage, online costs and reachable-target hit rates.
5. **Salt experiment:** precompute before drawing fresh salts; distinguish bucket matches, verified preimages, and original passwords.

## When to Use It

Teach generic attack costs and the limits of composition. This attacks tiny output spaces, not full SHA-256 or HMAC. Full SHA-256's approximately 2^128 generic collision scale is a formula only.

## Live Demo

[Hash Hunt](https://systemslibrarian.github.io/crypto-lab-hash-hunt/). Publication follows the complete correctness, browser, accessibility and mutation gate.

## What Can Go Wrong

- A valid tag over a collision-prone digest does not establish which letter was approved.
- Two active Floyd registers exclude seeds, hash state, counters and diagnostics.
- Full lookup covers reachable digests, not all outputs. H(x) targets differ from uniform output targets.
- Hellman's roughly 0.63 model requires the stated parameter relation and heuristic independence. Rainbow's recurrence is a random-function model, not a measured success rate.
- Matching endpoints still require regeneration and verification. Diagnostic coverage/merge sets consume extra temporary memory.
- Salts prevent mapping reuse, not per-user guessing. At 12 bits, accidental valid table answers and multiple preimages are possible.
- Runtime caps may stop a search. Input changes retire old results; cancellation terminates the worker. Bounded fallback can occupy the main thread if workers cannot be created.

## Real-World Usage

The birthday principle motivates hash lengths. Time–memory tradeoffs explain historical password precomputation, while salts and expensive password hashing address different costs. A shortened hash before a MAC can defeat an otherwise sound MAC construction.

Primary references: Katz–Lindell third edition §§6.4, 6.6.3 and Appendix A.4; [Hellman (1980)](https://www-ee.stanford.edu/~hellman/publications/36.pdf); [Avoine, Junod and Oechslin](https://crypto.junod.info/jacm08.pdf); [Yuval (1979)](https://doi.org/10.1080/0161-117991854025); [FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final); [RFC 4231](https://www.rfc-editor.org/rfc/rfc4231.html).

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

21 unit tests cover SHA-256, all truncation widths, RFC 4231's long-key/long-data HMAC example, Floyd predecessors, independently checked collisions, meaningful methods, chain inversion, salt timing and import boundaries. The exact 163-byte NIST CAVP LongMsg fixture and provenance are in `src/hash/sha256-longmsg-1304.json`. The official ZIP was inaccessible locally; a preserved NIST response file from TclTLS was independently checked with platform SHA-256. No current-ZIP comparison or coverage percentage is claimed.

Eight browser claims use Node SHA-256 to recheck displayed inputs and recovered preimages. Eleven mutations must pass baseline, build, move bundle bytes, fail a named test, restore, and pass again. Accessibility exercises real controls at 1280/320 pixels with the unchanged fleet contrast/non-text oracles. Browser QA runs in CI when supported local browser control is unavailable.

Pages, PRs and grouped Dependabot auto-merge use the entire gate; automated merges explicitly dispatch deployment.

## Performance

A measured hash calibration sets a 12–24-bit interaction cap. Searches also enforce time/evaluation limits; letter hashes can be slower. Counts exclude independent verification. Chain construction is capped at one million hashes. Timings describe this browser, not production-size SHA-256.

The Crypto Lab catalog integration records this lab’s concept, level, source evidence and fleet automation. Playwright port 4225 is unique across all 223 registered configurations; strictPort is enforced and existing servers are never reused.

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
