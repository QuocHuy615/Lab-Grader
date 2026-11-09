import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.ts";

const endpoint = "/labs/lab-01/review-queue";
const identities = new Map([
  ["test-ta", { role: "ta", classIds: ["class-01"] }],
  ["test-other-ta", { role: "ta", classIds: ["class-02"] }],
  ["test-student", { role: "student", classIds: ["class-01"] }],
  ["test-admin", { role: "admin", classIds: ["class-01"] }],
]);
const dependencies = {
  labs: [
    { labId: "lab-01", classId: "class-01" },
    { labId: "lab-empty", classId: "class-01" },
    { labId: "lab-other", classId: "class-02" },
  ],
  reviews: [
    {
      reviewId: "review-003",
      labId: "lab-01",
      submissionId: "submission-003",
      status: "in_review",
      submittedAt: "2026-11-05T02:00:00.000Z",
    },
    {
      reviewId: "review-002",
      labId: "lab-01",
      submissionId: "submission-002",
      status: "pending",
      submittedAt: "2026-11-05T01:00:00.000Z",
    },
    {
      reviewId: "review-001",
      labId: "lab-01",
      submissionId: "submission-001",
      status: "pending",
      submittedAt: "2026-11-05T01:00:00.000Z",
      studentEmail: "synthetic@example.test",
      rawModelOutput: "private fixture",
    },
    {
      reviewId: "review-done",
      labId: "lab-01",
      submissionId: "submission-done",
      status: "completed",
      submittedAt: "2026-11-05T00:00:00.000Z",
    },
    {
      reviewId: "review-other",
      labId: "lab-other",
      submissionId: "submission-other",
      status: "pending",
      submittedAt: "2026-11-05T00:00:00.000Z",
    },
  ],
  authenticate: (token) => {
    if (token === "test-error") throw new Error("private internal detail");
    return identities.get(token);
  },
};
for (const record of [...dependencies.labs, ...dependencies.reviews])
  Object.freeze(record);
Object.freeze(dependencies.labs);
Object.freeze(dependencies.reviews);

const app = createApp(dependencies);
let server;
let baseUrl;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

async function request(path = endpoint, token = "test-ta", method = "GET") {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: token === null ? {} : { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  });
  return { response, body: await response.json() };
}

function assertProblem(result, status, code, title) {
  const { response, body } = result;
  assert.equal(response.status, status);
  assert.match(
    response.headers.get("content-type"),
    /^application\/problem\+json\b/,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(Object.keys(body).sort(), [
    "detail",
    "instance",
    "status",
    "title",
    "type",
  ]);
  assert.equal(body.type, `urn:leetkob:problem:${code}`);
  assert.equal(body.status, status);
  assert.equal(body.title, title);
  assert.equal(typeof body.detail, "string");
  assert.ok(body.detail.length > 0);
  assert.ok(body.instance.startsWith("/"));
}

test("200: exact public schema, defaults, filtering, oldest first and reviewId tie-breaker", async () => {
  const { response, body } = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/json\b/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(body, {
    labId: "lab-01",
    items: [
      {
        reviewId: "review-001",
        submissionId: "submission-001",
        status: "pending",
        submittedAt: "2026-11-05T01:00:00.000Z",
      },
      {
        reviewId: "review-002",
        submissionId: "submission-002",
        status: "pending",
        submittedAt: "2026-11-05T01:00:00.000Z",
      },
      {
        reviewId: "review-003",
        submissionId: "submission-003",
        status: "in_review",
        submittedAt: "2026-11-05T02:00:00.000Z",
      },
    ],
    pagination: { page: 1, pageSize: 20, total: 3, nextPage: null },
  });
});

test("200: pagination traverses every item once and ends with nextPage null", async () => {
  const ids = [];
  for (let page = 1; page <= 3; page++) {
    const { body } = await request(`${endpoint}?page=${page}&pageSize=1`);
    assert.deepEqual(body.pagination, {
      page,
      pageSize: 1,
      total: 3,
      nextPage: page < 3 ? page + 1 : null,
    });
    ids.push(...body.items.map((item) => item.reviewId));
  }
  assert.deepEqual(ids, ["review-001", "review-002", "review-003"]);
});

test("200: empty lab and page beyond the end return arrays, never 404", async () => {
  for (const [path, page, total] of [
    ["/labs/lab-empty/review-queue", 1, 0],
    [`${endpoint}?page=99`, 99, 3],
  ]) {
    const { response, body } = await request(path);
    assert.equal(response.status, 200);
    assert.deepEqual(body.items, []);
    assert.deepEqual(body.pagination, {
      page,
      pageSize: 20,
      total,
      nextPage: null,
    });
  }
});

test("200: maximum page size is accepted", async () => {
  const { response, body } = await request(`${endpoint}?pageSize=100`);
  assert.equal(response.status, 200);
  assert.equal(body.pagination.pageSize, 100);
});

test("repeated GET requests preserve all stored review state", async () => {
  const before = JSON.stringify(dependencies.reviews);
  assert.deepEqual((await request()).body, (await request()).body);
  assert.equal(JSON.stringify(dependencies.reviews), before);
});

for (const token of [null, "unknown", "test-ta extra"]) {
  test(`401: missing or invalid authentication (${token})`, async () => {
    const result = await request(endpoint, token);
    assertProblem(result, 401, "unauthenticated", "Authentication required");
    assert.equal(result.response.headers.get("www-authenticate"), "Bearer");
  });
}

for (const token of ["test-student", "test-admin", "test-other-ta"]) {
  test(`403: access is denied for ${token} without queue data`, async () => {
    const result = await request(endpoint, token);
    assertProblem(result, 403, "forbidden", "Access denied");
    assert.equal(
      result.body.detail,
      "Only an assigned TA may access this queue.",
    );
  });
}

test("403: an assigned TA cannot query another class's lab", async () => {
  assertProblem(
    await request("/labs/lab-other/review-queue"),
    403,
    "forbidden",
    "Access denied",
  );
});

for (const path of [
  "/labs/INVALID/review-queue",
  "/labs/lab-%ZZ/review-queue",
  "/labs/lab-%2F/review-queue",
  `/labs/lab-${"a".repeat(61)}/review-queue`,
]) {
  test(`400: invalid identifier ${path}`, async () => {
    assertProblem(
      await request(path),
      400,
      "invalid-request",
      "Invalid request",
    );
  });
}

for (const query of [
  "page=0",
  "page=-1",
  "page=1.5",
  "page=abc",
  "page=",
  "page=01",
  "page=1e2",
  "page=9007199254740992",
  "page=9007199254740991&pageSize=100",
  "pageSize=0",
  "pageSize=-1",
  "pageSize=101",
  "pageSize=1.5",
  "pageSize=",
  "page=1&page=2",
  "pageSize=1&pageSize=2",
  "sort=newest",
]) {
  test(`400: invalid pagination ${query}`, async () => {
    assertProblem(
      await request(`${endpoint}?${query}`),
      400,
      "invalid-request",
      "Invalid request",
    );
  });
}

test("validation precedence: authentication, role, input, existence, ownership", async () => {
  const invalid = "/labs/INVALID/review-queue?page=0";
  assertProblem(
    await request(invalid, null),
    401,
    "unauthenticated",
    "Authentication required",
  );
  assertProblem(
    await request(invalid, "test-student"),
    403,
    "forbidden",
    "Access denied",
  );
  assertProblem(
    await request(invalid),
    400,
    "invalid-request",
    "Invalid request",
  );
  assertProblem(
    await request("/labs/lab-missing/review-queue", "test-other-ta"),
    404,
    "not-found",
    "Resource not found",
  );
});

test("404: unknown lab and route use Problem Details", async () => {
  for (const path of ["/labs/lab-missing/review-queue", "/unknown"]) {
    assertProblem(await request(path), 404, "not-found", "Resource not found");
  }
});

test("405: unsupported method includes Allow GET", async () => {
  const result = await request(endpoint, "test-ta", "POST");
  assertProblem(result, 405, "method-not-allowed", "Method not allowed");
  assert.equal(result.response.headers.get("allow"), "GET");
});

test("routing remains case-sensitive and rejects trailing slashes", async () => {
  for (const path of [
    "/Labs/lab-01/review-queue",
    "/labs/lab-01/review-queue/",
    "/labs/lab-01/REVIEW-QUEUE",
  ]) {
    assertProblem(await request(path), 404, "not-found", "Resource not found");
  }
});

test("route parameters are decoded exactly once", async () => {
  const result = await request("/labs/lab-%30%31/review-queue");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.labId, "lab-01");
  assertProblem(
    await request("/labs/lab-%2530%2531/review-queue"),
    400,
    "invalid-request",
    "Invalid request",
  );
});

test("malformed route encoding is validated after method, authentication and role", async () => {
  const path = "/labs/lab-%ZZ/review-queue";
  assertProblem(
    await request(path, null),
    401,
    "unauthenticated",
    "Authentication required",
  );
  assertProblem(
    await request(path, "test-student"),
    403,
    "forbidden",
    "Access denied",
  );
  assertProblem(
    await request(path, "test-ta", "POST"),
    405,
    "method-not-allowed",
    "Method not allowed",
  );
});

test("HEAD is rejected with 405 instead of implicitly running GET", async () => {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "HEAD",
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
  assert.equal(await response.text(), "");
});

test("500: unexpected failures hide internal details and server continues serving", async () => {
  const result = await request(endpoint, "test-error");
  assertProblem(result, 500, "internal-error", "Internal server error");
  assert.equal(result.body.detail, "An unexpected error occurred.");
  assert.equal(result.body.instance, "/");
  assert.equal((await request()).response.status, 200);
});
