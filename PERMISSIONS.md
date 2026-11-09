# Assistant permissions

## Allowed

- Read project files, edit agreed source and documentation, and run local checks.
- Install project dependencies when tool access permits. Prepare commits and PR changes within the authorized task.
- Read CI logs and branch rules. Use synthetic data for local API checks.

## Ask first

- Change repository visibility, branch protection or remote access. Publish or merge changes outside the agreed task.
- Provision paid services, issue a model API key, set or raise spending limits, or send student data to an external service.
- Rewrite shared history, delete shared data or change the API contract incompatibly.

## Never

- Put secrets in Git, logs, screenshots, fixtures or the C++ sandbox environment.
- Use a live model in unit tests, bypass required CI, or fabricate approvals and results.

Store local values in the ignored `.env` file. The checked-in `.env.example` lists supported variable names. PA2 uses no model API key and makes no paid model calls.
