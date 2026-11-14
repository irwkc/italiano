import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signMobileAccess, verifyMobileAccess } from "@/learn/mobile/tokens";

describe("mobile access tokens", () => {
  it("round-trips a valid access token", () => {
    process.env.SESSION_SECRET = "test-secret-for-mobile-tokens-1234";
    const token = signMobileAccess({
      typ: "mobile_access",
      role: "student",
      id: "st-1",
      sid: "ms-1",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const payload = verifyMobileAccess(token);
    assert.ok(payload);
    assert.equal(payload?.id, "st-1");
    assert.equal(payload?.sid, "ms-1");
  });

  it("rejects tampered tokens", () => {
    process.env.SESSION_SECRET = "test-secret-for-mobile-tokens-1234";
    const token = signMobileAccess({
      typ: "mobile_access",
      role: "student",
      id: "st-1",
      sid: "ms-1",
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    assert.equal(verifyMobileAccess(token.slice(0, -2) + "ab"), null);
    assert.equal(verifyMobileAccess(undefined), null);
  });

  it("rejects expired tokens", () => {
    process.env.SESSION_SECRET = "test-secret-for-mobile-tokens-1234";
    const token = signMobileAccess({
      typ: "mobile_access",
      role: "student",
      id: "st-1",
      sid: "ms-1",
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    assert.equal(verifyMobileAccess(token), null);
  });
});
