# Assistant rules

## Stack

- Use Node.js 22, TypeScript, Express 5 and the Node test runner. PA2 covers the TA review queue endpoint.

## Commands

- Install with `npm ci`. Run `npm run lint`, `npm run format:check`, `npm run typecheck` and `npm run test` locally and in CI.
- Check dependency peer ranges before upgrading TypeScript. The original ESLint install failed with `ERESOLVE` on TypeScript 7. See the [quality-check setup log](AI-LOG.md#quality-check-setup).

## Conventions

- Follow the [endpoint contract](docs/contract/review-queue.md). Verify role and class ownership before returning review data.
- Verify the PR base is `main` before recording merge-gate evidence. The first experiment ran on a PR targeting the setup branch. See the [CI evidence log](AI-LOG.md#ci-evidence).
- Record real assistant contributions, corrections and rejected proposals in [AI-LOG.md](AI-LOG.md). Follow [PERMISSIONS.md](PERMISSIONS.md).

## Never

- Keep credentials out of Git, test fixtures and the C++ execution sandbox.
- Keep unit tests free of live model calls.
- Never edit tests, eval data or labels just to make a check pass. Never bypass required checks or invent evidence.
