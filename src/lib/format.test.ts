import { describe, expect, it, vi, afterEach } from "vitest";
import {
  clientActivity,
  formatBytes,
  isRecentTimestamp,
  timestampMs,
} from "./format";

describe("formatBytes", () => {
  it("handles zero and invalid input", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(null)).toBe("0 B");
    expect(formatBytes(undefined)).toBe("0 B");
    expect(formatBytes(NaN)).toBe("0 B");
  });

  it("scales into human-readable units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });
});

describe("timestampMs", () => {
  it("returns undefined for empty input", () => {
    expect(timestampMs(null)).toBeUndefined();
    expect(timestampMs("")).toBeUndefined();
  });

  it("scales second-precision unix timestamps to ms", () => {
    expect(timestampMs(1_000_000)).toBe(1_000_000_000);
  });

  it("passes through ms-precision timestamps", () => {
    expect(timestampMs(1_700_000_000_000)).toBe(1_700_000_000_000);
  });

  it("parses ISO strings", () => {
    expect(timestampMs("2023-01-01T00:00:00.000Z")).toBe(
      Date.parse("2023-01-01T00:00:00.000Z")
    );
  });
});

describe("time-window helpers", () => {
  afterEach(() => vi.useRealTimers());

  it("isRecentTimestamp respects the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-01T00:05:00.000Z"));
    expect(isRecentTimestamp("2023-01-01T00:04:00.000Z")).toBe(true);
    expect(isRecentTimestamp("2023-01-01T00:00:00.000Z")).toBe(false);
  });

  it("clientActivity classifies handshakes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-01T00:05:00.000Z"));
    expect(clientActivity(null).label).toBe("Never connected");
    expect(clientActivity("2023-01-01T00:04:30.000Z").label).toBe("Active");
    expect(clientActivity("2023-01-01T00:00:00.000Z").label).toBe("Idle");
  });
});
