# Self-assessment — PA#2

Submitted by: 23120272 — Lê Quốc Huy

Total I claim: 94 / 100

| Criterion               | Maximum | Claimed | Evidence                                                                                                                                                                                                                                                                    |
| ----------------------- | ------: | ------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rules file              |      15 |      12 | [AGENTS.md](AGENTS.md) has four sections. The peer-range and PR-base rules trace to actual failures in [AI-LOG.md](AI-LOG.md).                                                                                                                                              |
| Permissions and secrets |      10 |       8 | [PERMISSIONS.md](PERMISSIONS.md) lists three tiers. [.env.example](.env.example) lists variables and [.gitignore](.gitignore) excludes local values. A scan of reachable commits found only `.env.example` among env files and no matches for common credential signatures. |
| One command per check   |      10 |      10 | The [README](README.md) and [CI workflow](.github/workflows/ci.yml) use the same four commands. The [successful run](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42551306978) installed dependencies with `npm ci`.                                               |
| CI merge gate           |      20 |      20 | [PA2.md](PA2.md) links the protected main ruleset, the failed required check and its repair. The [PR #4 screenshot](docs/evidence/pa2-pr-4-merge-blocked.png) shows the disabled merge button.                                                                              |
| Endpoint contract       |      25 |      25 | The [review queue contract](docs/contract/review-queue.md) follows the five IA#3 sections and documents role, class ownership, field rules, RFC 9457 errors, a two-page client example and versioning.                                                                      |
| Contract tests          |      15 |      14 | The [HTTP contract tests](tests/review-queue.contract.test.mjs) cover ownership, pagination and each documented error type. The [deliberate break](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42551198590/job/128946958561) failed two cases in required CI.     |
| AI log                  |       5 |       5 | [AI-LOG.md](AI-LOG.md) names tools, changes and rejected approaches with commit and PR evidence.                                                                                                                                                                            |
| **Total**               | **100** |  **94** |                                                                                                                                                                                                                                                                             |

## What I did not manage

- PA2 uses synthetic fixtures. A production model integration, provider spending cap and persistent storage are outside this checkpoint implementation.

## What I would do differently

I would verify the base branch before pushing the deliberate regression and capture the blocked merge panel while the required test is red. The first experiment used the setup branch, so I had to repeat it on a PR targeting `main`. I would also compare the contract with the IA#3 template before implementation so any missing sections are visible early.
