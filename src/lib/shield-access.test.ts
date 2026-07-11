import { describe, expect, it } from "vitest";
import { isInternalShieldAdminUrl, resolveShieldAdminUrl } from "./shield-access";

describe("isInternalShieldAdminUrl", () => {
  it("treats missing URLs as internal", () => {
    expect(isInternalShieldAdminUrl(undefined)).toBe(true);
    expect(isInternalShieldAdminUrl(null)).toBe(true);
    expect(isInternalShieldAdminUrl("")).toBe(true);
  });

  it("flags docker hostnames and private ranges", () => {
    expect(isInternalShieldAdminUrl("http://adguardhome:3000")).toBe(true);
    expect(isInternalShieldAdminUrl("http://localhost:3000")).toBe(true);
    expect(isInternalShieldAdminUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isInternalShieldAdminUrl("http://10.0.0.1:3000")).toBe(true);
    expect(isInternalShieldAdminUrl("http://192.168.1.1:3000")).toBe(true);
  });

  it("treats routable public URLs as external", () => {
    expect(isInternalShieldAdminUrl("https://node1.erebrus.io:3000")).toBe(false);
  });
});

describe("resolveShieldAdminUrl", () => {
  it("uses a routable stored URL directly", () => {
    const { url } = resolveShieldAdminUrl("https://node1.erebrus.io:3000");
    expect(url).toBe("https://node1.erebrus.io:3000");
  });

  it("derives a host from a safe node name when stored URL is internal", () => {
    const { url } = resolveShieldAdminUrl("http://localhost:3000", "node1");
    expect(url).toBe("https://node1.erebrus.io:3000");
  });

  it("falls back to the tunnel address for unsafe node names", () => {
    const { url } = resolveShieldAdminUrl(undefined, "../evil");
    expect(url).toBe("http://10.0.0.1:3000");
  });
});
