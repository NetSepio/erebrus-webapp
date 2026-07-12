import { describe, expect, it } from "vitest";
import {
  normalizeDropFile,
  normalizeDropNode,
  normalizeDropUpload,
  normalizeDropUsage,
  normalizeDropEncryptionMetadata,
  defaultPublicQuota,
} from "./normalize";

describe("normalizeDropNode", () => {
  it("maps node_id, scope and online state", () => {
    const node = normalizeDropNode({
      node_id: "12D3abc",
      name: "eu-1",
      region: "eu",
      scope: "private",
      online: true,
      org_id: "org1",
      capacity: "limited",
    });
    expect(node.id).toBe("12D3abc");
    expect(node.scope).toBe("private");
    expect(node.online).toBe(true);
    expect(node.capacity).toBe("limited");
    expect(node.accepting).toBe(true);
  });

  it("defaults capacity to unknown and treats explicit accepting=false", () => {
    const node = normalizeDropNode({ id: "n", accepting: false });
    expect(node.capacity).toBe("unknown");
    expect(node.accepting).toBe(false);
  });

  it("defaults gateway_available to false when the node does not expose 8080", () => {
    const node = normalizeDropNode({ id: "n" });
    expect(node.gateway_available).toBe(false);
    expect(node.gateway_url).toBeUndefined();
  });

  it("reads gateway exposure from the flag and the nested drop capability", () => {
    expect(normalizeDropNode({ id: "n", gateway_available: true }).gateway_available).toBe(true);
    expect(
      normalizeDropNode({ id: "n", capabilities: { drop: { gateway_available: true } } })
        .gateway_available
    ).toBe(true);
  });

  it("infers gateway_available when a gateway_url is present", () => {
    const node = normalizeDropNode({ id: "n", gateway_url: "https://node1.example:8080" });
    expect(node.gateway_available).toBe(true);
    expect(node.gateway_url).toBe("https://node1.example:8080");
  });
});

describe("normalizeDropFile", () => {
  it("parses public gateway url and gateway_urls list", () => {
    const file = normalizeDropFile({
      file_id: "f1",
      gateway_url: "https://node1.example/",
      gateway_urls: ["https://node2.example", "", 123, "https://node3.example"],
    });
    expect(file.gateway_url).toBe("https://node1.example/");
    expect(file.gateway_urls).toEqual([
      "https://node2.example",
      "123",
      "https://node3.example",
    ]);
  });

  it("leaves gateway fields undefined when absent", () => {
    const file = normalizeDropFile({ file_id: "f1" });
    expect(file.gateway_url).toBeUndefined();
    expect(file.gateway_urls).toBeUndefined();
  });

  it("defaults visibility to private and status to reserved", () => {
    const file = normalizeDropFile({ file_id: "f1", filename: "a.bin", size_bytes: 10 });
    expect(file.id).toBe("f1");
    expect(file.visibility).toBe("private");
    expect(file.status).toBe("reserved");
    expect(file.encrypted).toBe(false);
  });

  it("preserves known status and public visibility", () => {
    const file = normalizeDropFile({
      id: "f2",
      visibility: "public",
      status: "available",
      encrypted: true,
      cid: "bafy",
    });
    expect(file.visibility).toBe("public");
    expect(file.status).toBe("available");
    expect(file.encrypted).toBe(true);
    expect(file.cid).toBe("bafy");
  });
});

describe("normalizeDropUsage", () => {
  it("treats missing limit as null (unlimited)", () => {
    const usage = normalizeDropUsage({ used_bytes: 5, tier: "pro" });
    expect(usage.limit_bytes).toBeNull();
    expect(usage.tier).toBe("pro");
  });

  it("parses numeric limit", () => {
    const usage = normalizeDropUsage({ used: 5, reserved: 2, limit: 100, tier: "free" });
    expect(usage.used_bytes).toBe(5);
    expect(usage.reserved_bytes).toBe(2);
    expect(usage.limit_bytes).toBe(100);
  });
});

describe("normalizeDropUpload", () => {
  it("keeps received/size undefined when absent", () => {
    const up = normalizeDropUpload({ upload_id: "u1", status: "uploading" });
    expect(up.upload_id).toBe("u1");
    expect(up.received_bytes).toBeUndefined();
    expect(up.size_bytes).toBeUndefined();
  });
});

describe("normalizeDropEncryptionMetadata", () => {
  it("requires wrapped key and nonce prefix", () => {
    expect(normalizeDropEncryptionMetadata({ version: 1 })).toBeUndefined();
    const meta = normalizeDropEncryptionMetadata({
      version: 1,
      wrapped_data_key: "d2s=",
      nonce_prefix: "bm9uY2U=",
      chunk_size: 65536,
    });
    expect(meta?.wrapped_data_key).toBe("d2s=");
    expect(meta?.algorithm).toBe("AES-256-GCM");
  });
});

describe("defaultPublicQuota", () => {
  it("returns a byte budget for free and null for enterprise", () => {
    expect(defaultPublicQuota("free")).toBeGreaterThan(0);
    expect(defaultPublicQuota("enterprise")).toBeNull();
  });
});
