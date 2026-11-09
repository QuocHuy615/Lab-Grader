# Lab-Grader

LeeTKOB backend for C++ lab grading and constraint review, built with Express 5
and TypeScript.

## Development

Use Node.js 22 and npm. Install the locked dependencies with `npm ci`.

For a fresh checkout, create local configuration:

```powershell
Copy-Item .env.example .env
```

Add an uncommented `LAB_GRADER_DEMO=1` line in `.env` to enable the synthetic demo data.
The application automatically reads `.env` from the working directory for both
`npm run dev` and `npm start`. Existing shell environment variables take priority.
The file is optional; without it, defaults and shell variables apply.
Git ignores `.env`; commit only the `.env.example` template.

```sh
npm run dev
npm run build
npm start
```

The server listens at `http://127.0.0.1:3000`; `PORT` overrides the port.
By default, authentication rejects every credential until a real authenticator
is integrated. To explore synthetic data, set `LAB_GRADER_DEMO=1` in `.env` and run:

```powershell
npm run dev
```

In a second terminal:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3000/labs/lab-01/review-queue?page=1&pageSize=20" -Headers @{ Authorization = "Bearer demo-ta" }
```

`demo-ta` is a public demo credential for synthetic data only. Stop the server
with Ctrl+C. Set `LAB_GRADER_DEMO=0` in `.env` to disable demo mode on the next run.
See [the review queue contract](docs/contract/review-queue.md) for schema, errors,
permissions, pagination and compatibility rules.

## Quality checks

Run the same four commands locally as in GitHub Actions:

```sh
npm run lint
npm run format:check
npm run typecheck
npm run test
```

Use `npm run format` to apply formatting. Lint warnings fail the check.
Tests launch the real HTTP entry point with demo mode on/off and verify the review
queue contract over HTTP. No external service or database is needed. Both contract
and smoke tests run in the existing required `test` CI job.

## CI and branch protection

CI runs on every pull request and on pushes to `main` or the `pa2` tag, with checks named
`lint`, `format:check`, `typecheck`, and `test`.

The `main` ruleset requires pull requests and all four checks. In PR #4, a
deliberate change to the default page size failed two tests and disabled the
merge button. Restoring the documented default made all four checks pass.
See [PA2.md](PA2.md) for the ruleset, screenshot and CI runs.
