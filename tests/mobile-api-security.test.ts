import { describe, expect, it } from "vitest";
import {
  consumeMobileApiRateLimit,
  fingerprintBearerToken,
  getMobileNoStoreHeaders,
  getMobileRateLimitScope,
  getMobileRequestContentLength,
  getMobileSecurityChecklist,
  getMobileSecurityPolicy,
  isMobileRequestTooLarge,
} from "@/lib/mobile-api-security";
import { resetRateLimitBucketsForTests } from "@/lib/security/rate-limit";

function makeRequest(headers?: Record<string, string>) {
  return new Request("https://vitavault.test/api/mobile/device-readings", {
    method: "POST",
    headers,
  });
}

describe("mobile API security helpers", () => {
  it("defines endpoint-specific policies for mobile auth and reading sync", () => {
    expect(getMobileSecurityPolicy("auth:login").limit).toBe(10);
    expect(getMobileSecurityPolicy("readings:sync").limit).toBe(60);
    expect(getMobileSecurityPolicy("readings:sync").maxContentLengthBytes).toBe(256 * 1024);
  });

  it("builds stable rate limit scopes with endpoint and discriminator", () => {
    expect(getMobileRateLimitScope("auth:login", "Patient@Example.com")).toBe(
      "mobile-api:auth:login:patient@example.com"
    );
    expect(getMobileRateLimitScope("auth:me")).toBe("mobile-api:auth:me:anonymous");
  });

  it("blocks mobile requests after the endpoint limit", () => {
    resetRateLimitBucketsForTests();
    const now = new Date("2026-05-07T00:00:00.000Z");
    const request = makeRequest({ "x-forwarded-for": "203.0.113.10" });

    const first = consumeMobileApiRateLimit({ request, endpoint: "auth:logout", now });
    for (let index = 0; index < 29; index += 1) {
      consumeMobileApiRateLimit({ request, endpoint: "auth:logout", now });
    }
    const blocked = consumeMobileApiRateLimit({ request, endpoint: "auth:logout", now });

    expect(first.allowed).toBe(true);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(900);
  });

  it("detects oversized reading sync payloads from Content-Length", () => {
    const request = makeRequest({ "content-length": String(300 * 1024) });

    expect(getMobileRequestContentLength(request)).toBe(300 * 1024);
    expect(isMobileRequestTooLarge(request, "readings:sync")).toBe(true);
    expect(isMobileRequestTooLarge(request, "auth:me")).toBe(false);
  });

  it("returns no-store response headers and safe token fingerprints", () => {
    expect(getMobileNoStoreHeaders()).toMatchObject({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    expect(fingerprintBearerToken("vvm_secret_token")).toHaveLength(16);
    expect(fingerprintBearerToken("vvm_secret_token")).toBe(fingerprintBearerToken("vvm_secret_token"));
  });

  it("documents the mobile endpoint security checklist", () => {
    expect(getMobileSecurityChecklist()).toEqual(
      expect.arrayContaining([
        "Credential login is rate limited by email and client IP.",
        "Device reading payloads still validate against the schema-backed reading contract.",
      ])
    );
  });
});
