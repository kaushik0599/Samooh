import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ok,
  fail,
  withErrorHandling,
  ValidationError,
  NotFoundError,
  ConflictError,
} from "@/lib/api/response";

test("fail() omits `code` when not passed, keeping the plain string error shape", async () => {
  const res = fail("bad request");
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.deepEqual(body, { success: false, error: "bad request" });
  assert.equal("code" in body, false);
});

test("fail() includes `code` additively when passed", async () => {
  const res = fail("nope", 409, "CONFLICT");
  const body = await res.json();
  assert.deepEqual(body, { success: false, error: "nope", code: "CONFLICT" });
});

test("ok() never includes an error/code field", async () => {
  const res = ok({ hello: "world" });
  const body = await res.json();
  assert.deepEqual(body, { success: true, data: { hello: "world" } });
});

test("withErrorHandling maps each known error class to its status + code", async () => {
  const cases: Array<[() => never, number, string]> = [
    [
      () => {
        throw new ValidationError("bad field");
      },
      400,
      "VALIDATION_ERROR",
    ],
    [
      () => {
        throw new NotFoundError("missing");
      },
      404,
      "NOT_FOUND",
    ],
    [
      () => {
        throw new ConflictError("duplicate");
      },
      409,
      "CONFLICT",
    ],
  ];

  for (const [thrower, status, code] of cases) {
    const res = await withErrorHandling(async () => thrower());
    assert.equal(res.status, status);
    const body = await res.json();
    assert.equal(body.code, code);
  }
});

test("withErrorHandling never leaks an unknown error's message to the client", async () => {
  const res = await withErrorHandling(async () => {
    throw new Error("leaked secret detail");
  });
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.error, "Internal server error");
  assert.equal(body.code, "INTERNAL_ERROR");
  assert.equal(JSON.stringify(body).includes("leaked secret detail"), false);
});
