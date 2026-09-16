import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isWalletAddress,
  isTxHash,
  isUuid,
  requireAmount,
  requireWalletAddress,
  requireEnum,
  optionalStringArray,
} from "@/lib/validation";
import { ValidationError } from "@/lib/api/response";

test("isWalletAddress accepts valid 0x addresses only", () => {
  assert.equal(isWalletAddress("0x1234567890123456789012345678901234567890"), true);
  assert.equal(isWalletAddress("0x123"), false);
  assert.equal(isWalletAddress("not-an-address"), false);
  assert.equal(isWalletAddress(123), false);
});

test("isTxHash accepts valid 32-byte hashes only", () => {
  assert.equal(
    isTxHash("0x" + "a".repeat(64)),
    true
  );
  assert.equal(isTxHash("0x" + "a".repeat(63)), false);
});

test("isUuid validates uuid format", () => {
  assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuid("not-a-uuid"), false);
});

test("requireAmount rejects zero, negative, and non-numeric amounts", () => {
  assert.throws(() => requireAmount("0", "amount"), ValidationError);
  assert.throws(() => requireAmount("-5", "amount"), ValidationError);
  assert.throws(() => requireAmount("abc", "amount"), ValidationError);
  assert.equal(requireAmount("10.5", "amount"), "10.5");
});

test("requireWalletAddress normalizes to lowercase", () => {
  const mixedCase = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
  assert.equal(requireWalletAddress(mixedCase, "wallet"), mixedCase.toLowerCase());
  assert.throws(() => requireWalletAddress("bad", "wallet"), ValidationError);
});

test("requireEnum accepts only listed values", () => {
  assert.equal(requireEnum("JOIN", "preference", ["JOIN", "START", "EITHER"]), "JOIN");
  assert.throws(() => requireEnum("MAYBE", "preference", ["JOIN", "START", "EITHER"]), ValidationError);
  assert.throws(() => requireEnum(undefined, "preference", ["JOIN", "START", "EITHER"]), ValidationError);
});

test("optionalStringArray defaults to empty and enforces limits", () => {
  assert.deepEqual(optionalStringArray(undefined, "needs"), []);
  assert.deepEqual(optionalStringArray(["a", "b"], "needs"), ["a", "b"]);
  assert.throws(() => optionalStringArray("not-an-array", "needs"), ValidationError);
  assert.throws(
    () => optionalStringArray(Array.from({ length: 21 }, () => "x"), "needs"),
    ValidationError
  );
});
