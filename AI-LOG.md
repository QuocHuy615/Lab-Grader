# AI log

## Quality check setup

- Tool: Codex. Set up TypeScript, ESLint, Prettier, the Node test runner and GitHub Actions.
- Changed: The initial install failed with `ERESOLVE` because `typescript-eslint` did not support the existing TypeScript 7 version. Codex selected TypeScript 6 within the supported peer range and reran the checks. [Setup commit](https://github.com/QuocHuy615/Lab-Grader/commit/e293985)

## Review queue implementation

- Tool: Codex. Drafted the API contract, server, synthetic fixtures and HTTP contract tests. The user chose Express after reviewing the original `node:http` approach and asked for local `.env` support.
- Rejected: The native HTTP implementation was dropped at the user's request in favor of Express. The public behavior was checked with the existing HTTP tests and four routing regression cases. [API commit](https://github.com/QuocHuy615/Lab-Grader/commit/3609d97)
- Changed: The user requested `.env` loading so demo setup did not require a shell variable on each run. The file stayed local and the sample was tracked.

## CI evidence

- Tool: Codex and GitHub Actions. Changed the default `pageSize` temporarily to demonstrate a real contract failure, then restored the implementation.
- Rejected: The first failure was unsuitable as evidence of `main` protection. GitHub showed that PR #2 targeted `chore/setup-typescript`. The user opened PR #3 against `main`, and Codex repeated the experiment there. [PR #3 and runs](PA2.md)
- Changed: The deliberately incorrect default of `10` failed two tests expecting `20`. The repair restored `20` without modifying the assertions. [Repair commit](https://github.com/QuocHuy615/Lab-Grader/commit/b5415ad)

## Submission preparation

- Tool: Codex. Checked the rubric, recorded the permission tiers, screened Git history for common credential patterns and drafted the self-assessment using repository evidence. The student supplied the submission ID and directed the checkpoint preparation.
