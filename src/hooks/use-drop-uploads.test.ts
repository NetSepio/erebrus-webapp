import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-session", () => ({ getCurrentAuthToken: () => null, invalidateSession: vi.fn() }));

import { claimQueuedUploads, isUploadActive, preUploadCheck, type UploadItem } from "./use-drop-uploads";

describe("preUploadCheck", () => {
  const quota = { availableBytes: 120_000_000, maxFileBytes: 1_000_000_000 };

  it("warns before an oversized file is uploaded", () => {
    const r = preUploadCheck([{ name: "movie.mkv", size: 1_400_000_000 }], "public", quota);
    expect(r).toEqual({ ok: false, message: '"movie.mkv" is 1.4 GB; your plan allows 1 GB per file.' });
  });

  it("warns when public files exceed the remaining quota", () => {
    const r = preUploadCheck([{ name: "a", size: 100_000_000 }, { name: "b", size: 50_000_000 }], "public", quota);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("you have 120 MB left");
  });

  it("does not apply the public quota to workspace uploads, and passes without quota data", () => {
    expect(preUploadCheck([{ name: "a", size: 500_000_000 }], "private", quota)).toEqual({ ok: true });
    expect(preUploadCheck([{ name: "a", size: 5 }], "public", null)).toEqual({ ok: true });
  });
});

const queued = (id: string): UploadItem => ({
  id, file: new File(["test"], `${id}.txt`), filename: `${id}.txt`, size: 4,
  scope: "public", orgId: null, nodeId: "node", visibility: "public",
  status: "queued", sentBytes: 0, totalBytes: 4,
});

describe("upload queue claims", () => {
  it("claims each item synchronously so another pump cannot start it twice", () => {
    const original = [queued("a"), queued("b"), queued("c")];
    const first = claimQueuedUploads(original, 2);
    const second = claimQueuedUploads(first.items, 1);
    expect(first.toStart.map((item) => item.id)).toEqual(["a", "b"]);
    expect(second.toStart.map((item) => item.id)).toEqual(["c"]);
    expect(original.every((item) => item.status === "queued")).toBe(true);
  });

  it("respects capacity and never restarts cancelled or finished items", () => {
    const items = [queued("a"), { ...queued("b"), status: "canceled" as const }, { ...queued("c"), status: "done" as const }];
    expect(claimQueuedUploads(items, 0).toStart).toEqual([]);
    expect(claimQueuedUploads(items, 3).toStart.map((item) => item.id)).toEqual(["a"]);
  });

  it.each(["queued", "preparing", "reserving", "uploading", "finalizing"] as const)("treats %s as active", (status) => {
    expect(isUploadActive(status)).toBe(true);
  });

  it.each(["done", "error", "canceled"] as const)("treats %s as terminal", (status) => {
    expect(isUploadActive(status)).toBe(false);
  });
});
