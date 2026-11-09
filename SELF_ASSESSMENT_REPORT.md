# Self-assessment — PA#2

Submitted by: 23120272 — Lê Quốc Huy

Total I claim: 95 / 100

| Criterion               | Maximum | Claimed | Evidence                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------: | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules file              |      15 |      12 | [AGENTS.md](AGENTS.md) has four sections. The peer-range and PR-base rules trace to actual failures in [AI-LOG.md](AI-LOG.md).                                                                                                                                                                                                     |
| Permissions and secrets |      10 |       8 | [PERMISSIONS.md](PERMISSIONS.md) lists three tiers. [.env.example](.env.example) lists variables and [.gitignore](.gitignore) excludes local values. A scan of reachable commits found only `.env.example` among env files and no matches for common credential signatures.                                                        |
| One command per check   |      10 |      10 | The [README](README.md) and [CI workflow](.github/workflows/ci.yml) use the same four commands. The [successful run](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42551306978) installed dependencies with `npm ci`.                                                                                                      |
| CI merge gate           |      20 |      20 | [PA2.md](PA2.md) links the protected main ruleset, the failed required check and its repair. The [PR #4 screenshot](docs/evidence/pa2-pr-4-merge-blocked.png) shows the disabled merge button.                                                                                                                                     |
| Endpoint contract       |      25 |      25 | The [review queue contract](docs/contract/review-queue.md) follows the five IA#3 sections and documents role, class ownership, field rules, RFC 9457 errors, a two-page client example and versioning.                                                                                                                             |
| Contract tests          |      15 |      15 | The [HTTP contract tests](tests/review-queue.contract.test.mjs) cover cross-class access, pagination and each documented error type. On PR #4, two tests expected the default page size of 20 and received 10. The [required test job failed](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42555507719/job/128960188381). |
| AI log                  |       5 |       5 | [AI-LOG.md](AI-LOG.md) names tools, changes and rejected approaches with commit and PR evidence.                                                                                                                                                                                                                                   |
| **Total**               | **100** |  **95** |                                                                                                                                                                                                                                                                                                                                    |

## What I did not manage

I tested the review queue with synthetic records in memory. To try it locally, I set `LAB_GRADER_DEMO=1` and use the demo token. I have yet to connect a real login or database. The app makes no model calls in PA2, so there is no provider spending cap to show.

## What I would do differently

My first CI experiment ran on PR #2, which targeted the setup branch. I opened PR #3 against `main` and repeated the test. On PR #4, I took a screenshot while `test` was red and the merge button was disabled. Next time I would check the base branch before pushing the deliberate break, then take the screenshot before restoring `pageSize` to `20`.
