# Lab-Grader

LeeTKOB backend for C++ lab grading and constraint review.

## Development

Use Node.js 22 and npm. Install the locked dependencies with `npm ci`.

```sh
npm run dev
npm run build
npm start
```

## Quality checks

Run the same four commands locally as in GitHub Actions:

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
```

Use `npm run format` to apply formatting. Lint warnings fail the check.
The startup smoke test launches the TypeScript entry point and verifies its exit
code and output. Endpoint implementation and contract tests are still pending.

## CI and branch protection

CI runs on every pull request and on pushes to `main`, with separate checks named
`lint`, `format:check`, `typecheck`, and `test`.

After the first CI run, configure a GitHub branch rule for `main` requiring pull
requests and all four checks before merging. Adding the workflow alone does not
enable branch protection. Evidence of failed and repaired checks must come from
actual CI runs.
