import type { RequestHandler } from "express";
import type { AppDependencies, Principal } from "./app.js";
import { problem } from "./problem.js";

type AuthLocals = { principal: Principal };

export function authenticateTa(dependencies: AppDependencies): RequestHandler {
  return (request, response, next) => {
    const authorization = request.get("Authorization");
    const bearer = authorization && /^Bearer ([^\s]+)$/i.exec(authorization);
    const principal = bearer ? dependencies.authenticate(bearer[1]) : undefined;
    if (!principal) {
      problem(
        response,
        request.path,
        "unauthenticated",
        "A valid bearer token is required.",
      );
      return;
    }
    if (principal.role !== "ta") {
      problem(
        response,
        request.path,
        "forbidden",
        "Only an assigned TA may access this queue.",
      );
      return;
    }
    response.locals.principal = principal;
    next();
  };
}

function positiveInteger(value: string | null, fallback: number) {
  if (value === null) return fallback;
  if (!/^[1-9][0-9]*$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

export function reviewQueue(
  dependencies: AppDependencies,
): RequestHandler<
  { labId: string },
  unknown,
  unknown,
  Record<string, unknown>,
  AuthLocals
> {
  return (request, response) => {
    // Express has already decoded the route parameter exactly once.
    const { labId } = request.params;
    const instance = request.path;
    if (!/^lab-[a-z0-9][a-z0-9-]{0,59}$/.test(labId)) {
      problem(
        response,
        instance,
        "invalid-request",
        "labId must match lab-[a-z0-9][a-z0-9-]{0,59}.",
      );
      return;
    }
    // URLSearchParams preserves duplicates for strict contract validation.
    const params = new URL(request.originalUrl, "http://localhost")
      .searchParams;
    if (
      [...params.keys()].some(
        (key) =>
          !["page", "pageSize"].includes(key) ||
          params.getAll(key).length !== 1,
      )
    ) {
      problem(
        response,
        instance,
        "invalid-request",
        "Only one page and one pageSize parameter are allowed.",
      );
      return;
    }
    const page = positiveInteger(params.get("page"), 1);
    const pageSize = positiveInteger(params.get("pageSize"), 10);
    if (
      page === undefined ||
      pageSize === undefined ||
      pageSize > 100 ||
      !Number.isSafeInteger(page * pageSize)
    ) {
      problem(
        response,
        instance,
        "invalid-request",
        "page and pageSize must be positive safe integers; pageSize is at most 100 and page * pageSize must be safe.",
      );
      return;
    }
    const lab = dependencies.labs.find((item) => item.labId === labId);
    if (!lab) {
      problem(response, instance, "not-found", "Lab not found.");
      return;
    }
    if (!response.locals.principal.classIds.includes(lab.classId)) {
      problem(
        response,
        instance,
        "forbidden",
        "Only an assigned TA may access this queue.",
      );
      return;
    }
    const queue = dependencies.reviews
      .filter((item) => item.labId === labId && item.status !== "completed")
      .sort((left, right) => {
        const byTime =
          Date.parse(left.submittedAt) - Date.parse(right.submittedAt);
        return (
          byTime ||
          (left.reviewId < right.reviewId
            ? -1
            : left.reviewId > right.reviewId
              ? 1
              : 0)
        );
      });
    const offset = (page - 1) * pageSize;
    const items = queue.slice(offset, offset + pageSize).map((item) => ({
      reviewId: item.reviewId,
      submissionId: item.submissionId,
      status: item.status,
      submittedAt: item.submittedAt,
    }));
    response
      .set("Cache-Control", "no-store")
      .status(200)
      .json({
        labId,
        items,
        pagination: {
          page,
          pageSize,
          total: queue.length,
          nextPage: offset + items.length < queue.length ? page + 1 : null,
        },
      });
  };
}
