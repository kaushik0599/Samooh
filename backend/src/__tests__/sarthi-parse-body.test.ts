import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJsonBody } from "@/app/api/sarthi/parse-body";
import { ValidationError } from "@/lib/api/response";

function jsonRequest(body: string, contentType = "application/json"): Request {
  return new Request("http://localhost/api/sarthi/analyze", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

test("parseJsonBody returns a valid JSON object body", async () => {
  const req = jsonRequest(JSON.stringify({ samooh_id: "abc" }));
  const body = await parseJsonBody(req);
  assert.deepEqual(body, { samooh_id: "abc" });
});

test("parseJsonBody rejects malformed JSON with a ValidationError, not a raw parse error", async () => {
  const req = jsonRequest("{not valid json");
  await assert.rejects(() => parseJsonBody(req), ValidationError);
});

test("parseJsonBody rejects a null JSON body", async () => {
  const req = jsonRequest("null");
  await assert.rejects(() => parseJsonBody(req), ValidationError);
});

test("parseJsonBody rejects a top-level JSON array", async () => {
  const req = jsonRequest("[1,2,3]");
  await assert.rejects(() => parseJsonBody(req), ValidationError);
});

test("parseJsonBody rejects a bare JSON primitive", async () => {
  const req = jsonRequest('"just a string"');
  await assert.rejects(() => parseJsonBody(req), ValidationError);

  const reqNum = jsonRequest("42");
  await assert.rejects(() => parseJsonBody(reqNum), ValidationError);
});

test("parseJsonBody rejects an empty request body", async () => {
  const req = jsonRequest("");
  await assert.rejects(() => parseJsonBody(req), ValidationError);
});
