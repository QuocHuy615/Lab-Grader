# AI-LOG.md — CSC13114 PA#2

## 2026-11-05 — Node.js and TypeScript setup

Tool: Codex.

Asked for: Finish the project setup and commit it.

Kept: The Node.js and TypeScript scaffold, npm scripts and Git ignore rules. Typecheck, build and both startup commands passed.

Changed: The user had already created the branch and installed dependencies, so Codex finished that scaffold.

Rejected: None. [Setup commit](https://github.com/QuocHuy615/Lab-Grader/commit/18a647e)

## 2026-11-05 — Quality checks and CI

Tool: Codex.

Asked for: show me how to create lint, format, type and test checks that run locally and in GitHub Actions.

Kept: Four npm commands, separate CI jobs and a startup smoke test. The four checks passed locally.

Changed: npm returned `ERESOLVE` because the installed TypeScript 7 was outside the supported `typescript-eslint` peer range. Codex switched to TypeScript 6 and reran the checks.

Rejected: The incompatible TypeScript 7 and ESLint combination. [CI setup commit](https://github.com/QuocHuy615/Lab-Grader/commit/e293985)

## 2026-11-05 — Review queue contract and API

Tool: Codex.

Asked for: Implement the layout of TA review queue contract, endpoint and HTTP contract tests.

Kept: Role and class ownership checks, offset pagination, Problem Details errors and synthetic fixtures. The initial 39 tests passed.

Changed: A local experiment removed the class check. Two tests caught the resulting cross-class access, and Codex restored the check.

Rejected: The intentionally broken access check. [Contract and tests](docs/contract/review-queue.md)

## 2026-11-05 — Express migration and local configuration

Tool: Codex.

Asked for: Move the endpoint to Express and make local demo setup work through `.env`.

Kept: The existing API contract and tests. All 43 tests passed after four routing regression tests were added.

Changed: The user chose Express, and Codex split routing and error handling into separate files. At the user's request, startup also loads the ignored local `.env` file.

Rejected: The original native HTTP implementation because the user preferred Express routing and middleware. [API commit](https://github.com/QuocHuy615/Lab-Grader/commit/3609d97)

## 2026-11-09 — CI failure and repair evidence

Tool: Codex and GitHub Actions.

Asked for: Demonstrate that required CI detects a real API contract break.

Kept: Two failing tests on the deliberately changed default and four green checks after the repair.

Changed: PR #2 targeted the setup branch. The user opened PR #3 against `main`, and Codex repeated the red-to-green experiment there.

Rejected: The first run as evidence of the `main` merge gate. It still showed that CI detected the contract break. [PR and CI evidence](PA2.md)

## 2026-11-09 — Checkpoint documents and submission setup

Tool: Codex.

Asked for: Prepare the PA2 rules, permissions, evidence and self-assessment.

Kept: The three permission tiers, the rules tied to real incidents, and the rubric evidence. All four checks passed on the documentation commit.

Changed: The env sample now lists names without values, and CI listens for the `pa2` tag.

Rejected: Claiming a disabled merge button was observed. The recorded evidence is the active ruleset, failing job and API state. [Documentation CI](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42551762813)

## 2026-11-09 — Course template alignment

Tool: Codex.

Asked for: Rewrite the AI log and self-assessment to match the course templates.

Kept: The links to the failed test on PR #3 and the commit that restored the default page size to `20`.

Changed: Split the log into dated entries and added the submitter and reflection sections from the course report template.

Rejected: None.

## 2026-11-09 — API contract alignment with IA#3

Tool: Codex.

Asked for: Align the review queue contract with the five sections in the IA#3 starter and show how a client uses pagination.

Kept: The implemented route, ownership checks, response schema and error types.

Changed: Replaced the provisional layout with the IA#3 structure and added complete request and response examples for the first and last pages using the HTTP test fixture.

Rejected: None. [Revised contract](docs/contract/review-queue.md)

## 2026-11-09 — Final rubric and README review

Tool: Codex.

Asked for: Review the submission for unfinished material and raise the self-assessment to 95 if the evidence supports it.

Kept: The API behavior, tests and previously recorded CI evidence.

Changed: Claimed the final contract-test point based on the documented coverage and the failed required job on PR #4. Updated the README to describe the existing protection and point to the screenshot.

Rejected: None.

## Data sent by the product to a model

PA2 uses synthetic review data. The endpoint makes no model API calls and sends no product data to a model provider.
