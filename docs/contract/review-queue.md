# Review queue API contract — version 1

## 1. Conventions

- The endpoint path is `/labs/{labId}/review-queue`. Paths are case-sensitive and have no trailing slash.
- Success responses are JSON encoded as UTF-8. Application errors use Problem Details. Responses carry `Cache-Control: no-store`.
- Use `Authorization: Bearer <opaque-token>`. The scheme is case-insensitive. The server resolves the role and class assignments from the token. Clients cannot supply these permissions through request parameters.
- Lab IDs match `^lab-[a-z0-9][a-z0-9-]{0,59}$` after one percent-decoding pass. Submission and review IDs are opaque strings. Timestamps are UTC ISO 8601 strings with milliseconds.
- Clients should ignore additional response fields. Unknown and repeated query parameters are rejected.

## 2. Errors

Application errors follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html).
Clients use `type` to select behavior.

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json; charset=utf-8
Cache-Control: no-store

{
  "type": "urn:leetkob:problem:forbidden",
  "title": "Access denied",
  "status": 403,
  "detail": "Only an assigned TA may access this queue.",
  "instance": "/labs/lab-other/review-queue"
}
```

| Member     | Rule                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------- |
| `type`     | Absolute URI from the table below                                                           |
| `title`    | Stable title for that type                                                                  |
| `status`   | Integer equal to the HTTP response status                                                   |
| `detail`   | Nonempty explanation of the failure. Internal exception details and credentials are omitted |
| `instance` | Requested path without its query string. Internal errors use `/`                            |

| HTTP status | Type                                     | Title                   | When                                                                                                                   |
| ----------- | ---------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 400         | `urn:leetkob:problem:invalid-request`    | Invalid request         | The lab ID cannot be decoded, breaks the ID rule, or a query parameter violates the rules below                        |
| 401         | `urn:leetkob:problem:unauthenticated`    | Authentication required | Credentials are missing, malformed, unrecognized or rejected by the authenticator. Includes `WWW-Authenticate: Bearer` |
| 403         | `urn:leetkob:problem:forbidden`          | Access denied           | The caller has the wrong role or the lab belongs to an unassigned class                                                |
| 404         | `urn:leetkob:problem:not-found`          | Resource not found      | The lab does not exist or the path does not match a route                                                              |
| 405         | `urn:leetkob:problem:method-not-allowed` | Method not allowed      | The path matches the endpoint but the method is not GET. Includes `Allow: GET`                                         |
| 500         | `urn:leetkob:problem:internal-error`     | Internal server error   | An unexpected failure. The detail is `An unexpected error occurred.`                                                   |

## 3. Resources

### ReviewQueue

All fields below are required. Only `nextPage` is nullable.

| Field                 | Type and rule                                                       |
| --------------------- | ------------------------------------------------------------------- |
| `labId`               | String containing the requested, decoded lab ID                     |
| `items`               | Array of zero to `pageSize` ReviewItem objects                      |
| `pagination`          | Object with the four fields below                                   |
| `pagination.page`     | Positive integer containing the requested or default page           |
| `pagination.pageSize` | Integer from 1 to 100 containing the requested or default page size |
| `pagination.total`    | Nonnegative integer counting all unfinished reviews for this lab    |
| `pagination.nextPage` | Integer equal to `page + 1` when more items exist, otherwise `null` |

### ReviewItem

| Field          | Type and rule                                                                     |
| -------------- | --------------------------------------------------------------------------------- |
| `reviewId`     | Nonempty string identifying a unique review                                       |
| `submissionId` | Nonempty string identifying the submission                                        |
| `status`       | String enum with values `pending` and `in_review`. Completed reviews are excluded |
| `submittedAt`  | UTC ISO 8601 timestamp in `YYYY-MM-DDTHH:mm:ss.sssZ` format                       |

All ReviewItem fields are required. Student identities, class assignments, source code and raw model output are excluded from the response.

## 4. Endpoints

### GET /labs/{labId}/review-queue

Returns the unfinished reviews of one lab, oldest submissions first. Only an authenticated TA assigned to the lab's class may call it. Students and admins receive 403. A TA outside the class receives 403 for an existing lab and 404 for a missing lab. This distinction reveals lab existence to authenticated TAs.

| Input                      | Rule                                                                | Default |
| -------------------------- | ------------------------------------------------------------------- | ------- |
| `Authorization` header     | Required Bearer token                                               | None    |
| `labId` path parameter     | Required, 5–64 characters after decoding, as defined in Conventions | None    |
| `page` query parameter     | Optional positive decimal safe integer                              | 1       |
| `pageSize` query parameter | Optional decimal integer from 1 to 100                              | 20      |
| Request body               | Omit                                                                | None    |

Pagination values must match `^[1-9][0-9]*$`. Signs, whitespace, leading zeroes, fractions and exponents are invalid. The product `page * pageSize` must be at most `9007199254740991`.

The server checks in order and stops at the first failure.

1. Match path and method. An unmatched path gives 404. An unsupported method on the route gives 405.
2. Authenticate the caller, then verify the TA role. Failures give 401 and 403 respectively.
3. Decode and validate the lab ID and query. Invalid input gives 400.
4. Find the lab and check the TA's class assignment. Failures give 404 and 403 respectively.
5. Return **200** with a ReviewQueue and `Content-Type: application/json; charset=utf-8`.

### Pagination and repeated requests

Sort by `submittedAt` ascending, then by `reviewId` ascending using case-sensitive string comparison. Take up to `pageSize` items starting at offset `(page - 1) * pageSize`.

An empty queue returns 200 with `items: []`, `total: 0` and `nextPage: null`. A page beyond the last item also returns 200 with an empty array and the actual total. Each request reads current data. Concurrent inserts, deletions or completion can shift offsets, so a client may need to refresh from page 1.

GET leaves review and grade state untouched. Repeating it against unchanged data returns the same JSON values. The request requires no idempotency key.

### Example client flow

This example uses the synthetic HTTP test fixture with three unfinished reviews. Request the first page with two items.

```http
GET /labs/lab-01/review-queue?pageSize=2 HTTP/1.1
Host: 127.0.0.1:3000
Authorization: Bearer test-ta
```

```json
{
  "labId": "lab-01",
  "items": [
    {
      "reviewId": "review-001",
      "submissionId": "submission-001",
      "status": "pending",
      "submittedAt": "2026-11-05T01:00:00.000Z"
    },
    {
      "reviewId": "review-002",
      "submissionId": "submission-002",
      "status": "pending",
      "submittedAt": "2026-11-05T01:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 2, "total": 3, "nextPage": 2 }
}
```

Send the returned page number with the same page size and token.

```http
GET /labs/lab-01/review-queue?page=2&pageSize=2 HTTP/1.1
Host: 127.0.0.1:3000
Authorization: Bearer test-ta
```

```json
{
  "labId": "lab-01",
  "items": [
    {
      "reviewId": "review-003",
      "submissionId": "submission-003",
      "status": "in_review",
      "submittedAt": "2026-11-05T02:00:00.000Z"
    }
  ],
  "pagination": { "page": 2, "pageSize": 2, "total": 3, "nextPage": null }
}
```

Stop when `nextPage` is `null`. The manual demo uses `LAB_GRADER_DEMO=1` and the public demo token `demo-ta`. That fixture contains one item, so it returns `nextPage: null` on the first page. The default entry point rejects credentials until an authenticator is configured. The checkpoint has in-memory storage and an injected authenticator. Token issuance and expiry enforcement belong to the future identity provider.

Run the [HTTP contract tests](../../tests/review-queue.contract.test.mjs) with `npm run test`. They verify field shape, role and class isolation, every documented problem type, pagination and read-only behavior. [PA2 CI evidence](../../PA2.md) records the intentional pagination regression and the repair.

## 5. Versions and the legacy API

Version 1 serves the unprefixed path defined above. Additive changes such as optional fields may stay within this contract. Removing or renaming a field, changing a field type, tightening validation, changing permissions, changing pagination defaults or ordering, or changing an existing error meaning requires a new version and a documented migration. Existing clients can continue using the current path during migration.

Update the contract and its tests in the same reviewed change when introducing a version. This checkpoint has no legacy review queue API and therefore no legacy deprecation or sunset schedule.
