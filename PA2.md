# PA2 CI evidence

- [Public repository](https://github.com/QuocHuy615/Lab-Grader)
- [Protected `main` ruleset](https://github.com/QuocHuy615/Lab-Grader/rules/26621814)
- [CI runs for the `pa2` tag](https://github.com/QuocHuy615/Lab-Grader/actions/workflows/ci.yml?query=branch%3Apa2)

[PR #3](https://github.com/QuocHuy615/Lab-Grader/pull/3) targets `main`. The [branch rules returned by GitHub](https://api.github.com/repos/QuocHuy615/Lab-Grader/rules/branches/main) include ruleset `26621814`, which requires `lint`, `format:check`, `typecheck`, and `test` before merging.

1. [Deliberate contract break](https://github.com/QuocHuy615/Lab-Grader/commit/40a3d3c5f9ae97f3de54366885c6d3d799ab468f). The commit changed the default `pageSize` from `20` to `10` and left the [API contract](docs/contract/review-queue.md) and tests intact.
2. [Failed test job on PR #3](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42551198590/job/128946958561). Two contract tests expected `20` and received `10`. The other three checks passed. While this commit was the PR head, the GitHub API reported `mergeable_state: unstable`, and the required `test` check was failing. The job log confirms that the workflow checked out `refs/remotes/pull/3/merge`.
3. [Repair commit](https://github.com/QuocHuy615/Lab-Grader/commit/b5415ad68eaa172b7a88a8084ba970430e5b8907). The commit restored the default to `20`.
4. [Passing CI run on PR #3](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42551306978). All four required checks passed on the repair.

The experiment used the failing required check and the PR status as evidence. No merge was attempted during the experiment.

The earlier [trial on PR #2](https://github.com/QuocHuy615/Lab-Grader/actions/runs/42550270328/job/128944057272) targeted `chore/setup-typescript`.
