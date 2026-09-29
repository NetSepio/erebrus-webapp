import { describe, expect, it } from "vitest";
import { forwardedClientHeaders, gatewayProxyTarget } from "./gateway-proxy";

describe("gatewayProxyTarget", () => {
  const base = "https://dev.gateway.erebrus.io/";

  it("maps segments under /api/v2/", () => {
    expect(gatewayProxyTarget(base, ["vpn", "clients"])?.toString()).toBe("https://dev.gateway.erebrus.io/api/v2/vpn/clients");
  });

  it("rejects traversal, including decoded slashes", () => {
    expect(gatewayProxyTarget(base, ["..", "metrics"])).toBeNull();
    expect(gatewayProxyTarget(base, ["..", "..", "metrics"])).toBeNull();
    expect(gatewayProxyTarget(base, ["../../metrics"])).toBeNull();
    expect(gatewayProxyTarget(base, ["a\\..\\b"])).toBeNull();
    expect(gatewayProxyTarget(base, ["."])).toBeNull();
  });

  it("encodes odd characters instead of letting them change the path", () => {
    expect(gatewayProxyTarget(base, ["drop", "files", "a?b#c"])?.pathname).toBe("/api/v2/drop/files/a%3Fb%23c");
  });
});

describe("forwardedClientHeaders", () => {
  it("forwards the client IP chain and real IP", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.7", "x-real-ip": "203.0.113.7" });
    expect(forwardedClientHeaders(h)).toEqual({ "X-Forwarded-For": "203.0.113.7", "X-Real-IP": "203.0.113.7" });
  });

  it("falls back to x-real-ip and sends nothing when unknown", () => {
    expect(forwardedClientHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toEqual({
      "X-Forwarded-For": "198.51.100.2",
      "X-Real-IP": "198.51.100.2",
    });
    expect(forwardedClientHeaders(new Headers())).toEqual({});
  });
});
