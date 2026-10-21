# Audit repair verification

Audited baseline: `42d7223b307ce0aa35b0bc89207f9111bc66dfbb`. Repair scope: this repository only.

The supplied handoff and repair proposal were checked against the repository and its brief. The full numbered audit reports were not attached; descriptive labels are used where the supplied material did not establish a finding number. No unprovided finding is claimed resolved.

Dependencies were installed with `npm ci --offline --ignore-scripts` from the available cache. Local browser runs used `CHROMIUM_PATH=/tmp/chromium`; CI retains its normal Playwright browser installation. Builds include TypeScript checking. No tests were skipped.

## Findings and decisions

| Finding | Verified disposition and evidence |
| --- | --- |
| HH-1: same-type collision | The semantic verifier rejects a genuine same-type eight-bit collision. A deterministic real Floyd walk logs four rejected same-type pairs before finding a cross-type pair; Node SHA-256 independently checks every pair. Separate mutations bypass the verifier and the retry. |
| Salt known during precomputation | `src/salt/experiment.ts` builds before drawing targets. Tests observe actual CSPRNG draws relative to the real build-complete callback; a mutation preselects the targets and is killed. The existing bucket-validity mutation remains a separate check. |
| HH-2: runner recommendation | Rejected restoring the weaker base runner. Existing structured report validation remains; generated output is cleaned before builds, and the baseline bundle hash is captured immediately after the clean build. This prevents stale mutant chunks in browser artifacts from causing false restoration failures. |
| HH-3: counts | Dynamic execution gives 34 unit cases, 22 browser claims, two accessibility drives and 24 mutations. The handoff and repair proposal disagreed about original counts; executed counts govern. |
| HH-4: links | Hash Zoo, DNSSEC Chain, Feistel Forge and Grover links have the brief's subject framing. The browser checks their actual destinations. |
| Verdict / mask / Scenario B | Collision wording matches the brief; the zero-table-hit verdict is conditional on measured results. The tooltip describes the MSB mask and measured cap. The full table is named Bcrypt Forge's Scenario B. |
| Start-point boundary | Existing inversion was correct. Explicit Hellman/rainbow tests show a stored start is not automatically a preimage; unsuccessful lookup can explain this boundary. |
| Condensed accessibility files | Their core contrast/non-text algorithms were already sound. Reference structure and structural boot checks are restored; state drives include the new collision control and open retry log at 1280px and 320px. |
| HH-12: zero-hit claim | Kept measured valid accidental preimages. Under the stated ideal model, M=2624 stored outputs and N=4096 give per-user probability M(2N−1)/N³, or about 0.624% for at least one valid hit among 20 users. The proposal's 0.3% omits the chance of testing the originally sampled password. This is a model, not a measured frequency. |

Existing SHA/HMAC vectors, multicollision mechanisms, calibration, registered port, header, theme pin and deployment workflow were retained. The full table experiment is not represented as a Hellman table.

## Executed validation

| Check | Observed result |
| --- | --- |
| `npm test` | 34 passed |
| `npm run build` | Passed |
| `npx playwright test` | 22 claims + 2 accessibility drives passed |
| `npm run test:mutations` | 24/24 killed and restored |

A mutation kill means a passing baseline, a non-empty source patch, a successful changed bundle, an assertion failure in the named owning test, an identical restored bundle and a passing restored test. Setup failures, crashes and test timeouts are rejected. Reproducible patches and test ownership are below. These local results do not claim a future hosted deployment or a formal security proof.

## Executable finding matrix

The descriptive finding IDs below identify concrete regressions; they do not invent the missing numbered audit report. Each row was observed failing only under its source patch. Other verified decisions and primitive checks are detailed above.

| Finding ID / regression | Verified | Fix (file:line) | Named test | Mutation name | Status |
| --- | --- | --- | --- | --- | --- |
| HH / wrong birthday product | Yes | `src/math/birthday.ts:1` | birthday probability | wrong birthday product | Fixed and verified |
| HH / wrong truncation | Yes | `src/hash/truncate.ts:5` | table collision | wrong truncation | Fixed and verified |
| HH / same predecessor | Yes | `src/attack/floyd.ts:8` | floyd collision | same predecessor | Fixed and verified |
| HH / negative forgery claim | Yes | `src/main.ts:22` | meaningful forgery is a cross-type collision with a real accepted HMAC | negative forgery claim | Fixed and verified |
| HH / wrong full precompute count | Yes | `src/attack/tmto/tables.ts:20` | chained table preimages | wrong full precompute count | Fixed and verified |
| HH / negative salt claim | Yes | `src/main.ts:32` | salted recovered preimages | negative salt claim | Fixed and verified |
| HH / verifier compares one bit too few | Yes | `src/verify/verify.ts:4` | near miss verifier | verifier compares one bit too few | Fixed and verified |
| HH / wrong letter rendered | Yes | `src/main.ts:10` | meaningful forgery is a cross-type collision with a real accepted HMAC | wrong letter rendered | Fixed and verified |
| HH / false alarms become hits | Yes | `src/worker/tasks.ts:8` | chained table preimages | false alarms become hits | Fixed and verified |
| HH / bucket match becomes salted answer | Yes | `src/salt/experiment.ts:13` | salted recovered preimages | bucket match becomes salted answer | Fixed and verified |
| HH / MAC recomputation bypasses verify | Yes | `src/mac/hashAndMac.ts:2` | meaningful forgery is a cross-type collision with a real accepted HMAC | MAC recomputation bypasses verify | Fixed and verified |
| HH / next fork reuses the prior chaining value | Yes | `src/attack/joux.ts:130` | multicollision forks chain from each verified next state | next fork reuses the prior chaining value | Fixed and verified |
| HH / enumeration reads the next fork bit | Yes | `src/attack/joux.ts:166` | enumeration maps every mask to its displayed fork choices | enumeration reads the next fork bit | Fixed and verified |
| HH / cascade accepts the first prior message without matching H2 | Yes | `src/attack/joux.ts:265` | cascade pair independently collides under H1 and H2 | cascade accepts the first prior message without matching H2 | Fixed and verified |
| HH / Merkle-Damgard omits the encoded length block | Yes | `src/md/toyMd.ts:54` | toy Merkle-Damgard display includes the encoded length block | Merkle-Damgard omits the encoded length block | Fixed and verified |
| HH / reported cost skips H2 calls | Yes | `src/attack/joux.ts:291` | cascade compression-call parts sum and include every H2 evaluation | reported cost skips H2 calls | Fixed and verified |
| HH / naive birthday exponent uses all 2n bits | Yes | `src/attack/joux.ts:204` | naive 2n-bit comparison uses the birthday exponent and measured rate | naive birthday exponent uses all 2n bits | Fixed and verified |
| HH / fork flip keeps the original message mask | Yes | `src/main.ts:97` | flipping one displayed fork changes the message without moving H1 | fork flip keeps the original message mask | Fixed and verified |
| HH / negative concatenation claim is removed | Yes | `src/main.ts:81` | cascade pair independently collides under H1 and H2 | negative concatenation claim is removed | Fixed and verified |
| HH / negative-claim evidence paints the cost check red | Yes | `src/main.ts:78` | cascade pair independently collides under H1 and H2 | negative-claim evidence paints the cost check red | Fixed and verified |
| HH / fork selector retires the chain | Yes | `src/main.ts:91` | every selected fork stays inspectable | fork selector retires the chain | Fixed and verified |
| HH / report same-type meaningful collision as success | Yes | `src/verify/verify.ts:52` | same-type meaningful collision is rejected despite matching hashes | report same-type meaningful collision as success | Fixed and verified |
| HH / stop Floyd at a same-type collision instead of retrying | Yes | `src/attack/meaningful.ts:7` | Floyd displays real same-type retries before the meaningful forgery | stop Floyd at a same-type collision instead of retrying | Fixed and verified |
| HH / salts known before table build | Yes | `src/salt/experiment.ts:8` | actual salt draws occur only after precomputation has completed | salts known before table build | Fixed and verified |

## Preserved scope

The brief files, deployment workflows, registered Playwright port, shared header and theme pin were not edited. Supporting catalog and reference repositories were read only. See README “Deviations from the brief” for source-backed corrections and the intentional mutation-runner hardening.

## Final command excerpts

```text

npm test
Test Files  3 passed (3)
Tests  34 passed (34)

npm run build
> tsc --noEmit && vite build
✓ built in 119ms

CHROMIUM_PATH=/tmp/chromium npx playwright test
24 passed (44.5s)

CHROMIUM_PATH=/tmp/chromium npm run test:mutations
24 / 24 mutations killed and restored
```

Mutation restoration uses each freshly generated Vite manifest to identify emitted scripts. It excludes unreferenced stale browser artifacts while retaining the successful-build, changed-bundle, exact owning-assertion and identical-restoration requirements.
