# GET /labs/{labId}/review-queue

Contract version: 1.0.0. Status: implemented checkpoint baseline.

This contract records project decisions, not verified course or product-owner
requirements. The IA3 `CONTRACT.md` template and full class brief are not present
in this repository; reconcile this document with them before submission.

## Purpose and caller

Return unfinished submission reviews for one lab, oldest submissions first.
Only an authenticated TA assigned to the lab's class can read the queue.
Students and admins are denied in this baseline. A valid TA accessing an existing
lab outside their classes receives 403; a nonexistent lab receives 404. This
deliberately reveals existence to authenticated TAs and needs product-owner review.

## Authentication and implementation boundary

The request uses `Authorization: Bearer <opaque-token>` (scheme case-insensitive).
Missing, malformed, expired, or unrecognized credentials return 401. The injected
server-side authenticator resolves credentials into a role and assigned class IDs;
request parameters cannot grant permissions. Expiration must be enforced by the
authenticator when a real identity provider is integrated.

This checkpoint uses an in-memory repository and injectable authenticator. The
default entry point denies all credentials. Real login, token issuance/expiration,
database persistence and deployment authentication are not implemented.

For local demonstration only, `LAB_GRADER_DEMO=1` enables synthetic `lab-01` and the
public credential `demo-ta`, assigned to `class-01`. This is a demo credential,
not a production secret. The entry point binds to `127.0.0.1`.

## Request

| Input      | Rule                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| Method     | GET; other methods on this route return 405, with `Allow: GET`                    |
| Path       | `/labs/{labId}/review-queue`; no trailing slash                                   |
| `labId`    | Percent-decode once, then match `^lab-[a-z0-9][a-z0-9-]{0,59}$` (5–64 characters) |
| `page`     | Optional positive decimal safe integer, default 1                                 |
| `pageSize` | Optional positive decimal integer, 1–100, default 20                              |
| Body       | Unused; callers should send no body                                               |

Pagination values must match `^[1-9][0-9]*$`: no signs, whitespace, leading zeroes,
fractions or exponents. `page * pageSize` must be a JavaScript safe integer
(at most 9007199254740991). Unknown or repeated query parameters return 400.
Percent-decoded slashes, malformed percent escapes and invalid lab IDs return 400
when they match the route shape. An unmatched path returns 404.

Processing order: route, method, authentication, role, input validation, lab
existence, class ownership, response. Thus unauthenticated requests to this route
receive 401 before input validation; unmatched paths receive 404 before auth.

## Successful response

Status: **200**. `Content-Type: application/json; charset=utf-8`.
All responses include `Cache-Control: no-store`.

```json
{
  "labId": "lab-01",
  "items": [
    {
      "reviewId": "review-001",
      "submissionId": "submission-001",
      "status": "pending",
      "submittedAt": "2026-11-05T01:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "nextPage": null
  }
}
```

All displayed fields are required. Only `nextPage` is nullable.

| Field                 | Type and meaning                                                      |
| --------------------- | --------------------------------------------------------------------- |
| `labId`               | String, decoded requested lab ID                                      |
| `items`               | Array of zero to `pageSize` public review objects                     |
| `reviewId`            | Nonempty string, unique review identifier                             |
| `submissionId`        | Nonempty string, submission identifier                                |
| `status`              | String enum: `pending` or `in_review`; completed reviews are excluded |
| `submittedAt`         | UTC ISO 8601 timestamp, `YYYY-MM-DDTHH:mm:ss.sssZ`                    |
| `pagination.page`     | Integer, requested/default page                                       |
| `pagination.pageSize` | Integer, requested/default page size                                  |
| `pagination.total`    | Nonnegative integer, unfinished review count for this lab             |
| `pagination.nextPage` | Current page + 1 if more items exist, otherwise null                  |

The repository must supply unique nonempty identifiers and normalized timestamps.
Responses project only these fields; student identities, class membership, source
code, raw model output and private repository fields are excluded.

## Pagination and repeated requests

Offset pagination uses `(page - 1) * pageSize`. Sort by `submittedAt` ascending,
then `reviewId` ascending using case-sensitive string comparison. The repository
order does not affect the result. An existing empty lab returns `items: []`,
`total: 0`, `nextPage: null`. Pages beyond the end return 200 with an empty array
and the actual total. The final nonempty page also has `nextPage: null`.

Each request reads current repository state. There is no snapshot guarantee
between requests: concurrent inserts, completion or deletion can shift offsets,
causing duplicates or omissions. Refresh from page 1 after changes.

GET does not mutate review state, publish marks or mark items as reviewed.
Repeated requests against unchanged data return equal JSON values. Creation
idempotency keys are not applicable.

## Error responses

Errors follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) and use
`Content-Type: application/problem+json; charset=utf-8`. Required fields:
`type` (absolute problem URI), `title` (stable string), `status` (HTTP status
integer), `detail` (nonempty explanation), `instance` (request path without query).
For unexpected failures, `instance` is `/`. Internal exception details and
credentials are never returned. Clients should branch on `type`, not `detail`.

Example: a TA accessing another class's existing lab receives:

```json
{
  "type": "urn:leetkob:problem:forbidden",
  "title": "Access denied",
  "status": 403,
  "detail": "Only an assigned TA may access this queue.",
  "instance": "/labs/lab-other/review-queue"
}
```

The following types use the prefix `urn:leetkob:problem:`. Each row defines an
error response with the five fields above, its listed status/title, an explanation
of that condition, and the requested path as instance (except 500).

| Status | Type suffix          | Title                   | Trigger / detail                                                                 |
| ------ | -------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| 400    | `invalid-request`    | Invalid request         | Invalid lab ID, query parameter or pagination; detail explains the violated rule |
| 401    | `unauthenticated`    | Authentication required | `A valid bearer token is required.`; includes `WWW-Authenticate: Bearer`         |
| 403    | `forbidden`          | Access denied           | `Only an assigned TA may access this queue.`; wrong role or class assignment     |
| 404    | `not-found`          | Resource not found      | `Lab not found.` for a missing lab, `Route not found.` for an unmatched path     |
| 405    | `method-not-allowed` | Method not allowed      | `Use GET for this endpoint.`; includes `Allow: GET`                              |
| 500    | `internal-error`     | Internal server error   | `An unexpected error occurred.`; instance `/`                                    |

## Compatibility

Renaming/removing fields, changing types, authentication, permission semantics,
pagination defaults/order or existing status meanings is a breaking change.
Update this contract and tests together through a reviewed PR and document client
migration before release; introduce a separately versioned endpoint if existing
consumers need the old behavior. Clients should tolerate future additive fields.

## Executable contract tests

`tests/review-queue.contract.test.mjs` sends real HTTP requests to an ephemeral
local server, using independently specified expected responses and synthetic data.
`npm test` runs these tests and entry-point smoke tests locally and in the existing
required `test` CI job; any assertion failure exits nonzero.

Coverage includes exact public response shape, defaults, ordering and tie-breaks,
completed/other-lab exclusion, empty and out-of-range pages, pagination boundaries,
read-only behavior, all documented error types/headers, wrong roles and cross-class
ownership denial, validation precedence, and recovery after an internal failure.

## Deliberate CI break procedure

1. Commit the correct implementation and tests on a feature branch; push and open a PR.
2. On that PR branch, temporarily remove the class-ownership guard in `src/review-queue.ts`.
3. Push the deliberate defect. The cross-class contract tests must fail in CI.
4. Record the failed Actions run URL and a PR view showing required checks blocking merge.
5. Restore the guard in a new commit, push, and record the green run and repair commit.
6. Add real evidence links to root `PA2.md`. Do not merge the broken version.

A local failure is useful verification but is not evidence that GitHub blocked a
merge. No CI experiment or evidence link is claimed by this document.
