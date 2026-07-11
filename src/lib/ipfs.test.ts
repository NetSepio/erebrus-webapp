import { describe, expect, it } from "vitest";
import { ipfsImageUrl } from "./ipfs";

describe("ipfsImageUrl", () => {
  it("returns null for empty input", () => {
    expect(ipfsImageUrl(null)).toBeNull();
    expect(ipfsImageUrl(undefined)).toBeNull();
    expect(ipfsImageUrl("   ")).toBeNull();
  });

  it("passes through absolute http(s) URLs unchanged", () => {
    expect(ipfsImageUrl("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png"
    );
    expect(ipfsImageUrl("http://example.com/a.png")).toBe(
      "http://example.com/a.png"
    );
  });

  it("resolves bare CIDs against the gateway base", () => {
    expect(ipfsImageUrl("QmHash")).toBe("http://127.0.0.1:8080/ipfs/QmHash");
  });

  it("strips the ipfs:// scheme before resolving", () => {
    expect(ipfsImageUrl("ipfs://QmHash")).toBe(
      "http://127.0.0.1:8080/ipfs/QmHash"
    );
  });
});
