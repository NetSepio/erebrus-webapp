import { describe, expect, it } from "vitest";
import type { GatewayAccountUsage } from "@/lib/gateway/types";
import { hasDeviceSlot, planEndingNotice, planShortName, usagePercent } from "./plan-usage";

const usage = (over: Partial<GatewayAccountUsage> = {}, org: Partial<NonNullable<GatewayAccountUsage["entitlement_org"]>> = {}): GatewayAccountUsage => ({
  vpn: { client_limit: 3, public_clients: 3, paused_clients: 0, limit_after_access_ends: 1 },
  drop: { used_bytes: 0, reserved_bytes: 0, quota_bytes: 1_000_000_000, max_file_bytes: 1_000_000_000 },
  api_keys_available: true,
  entitlement_org: {
    id: "o", name: "My Workspace", plan: "personal.starter",
    paid_access_until: "2026-10-30T00:00:00Z", access_ending: true, ...org,
  },
  ...over,
});

describe("planEndingNotice", () => {
  it("warns how many devices will pause when Starter ends", () => {
    expect(planEndingNotice(usage())).toEqual({
      until: "2026-10-30T00:00:00Z", pauseCount: 2, limitAfter: 1, planName: "Starter",
    });
  });

  it("stays quiet when access is not ending or devices fit the Basic limit", () => {
    expect(planEndingNotice(usage({}, { access_ending: false }))).toBeNull();
    expect(planEndingNotice(usage({ vpn: { client_limit: 3, public_clients: 1, paused_clients: 0, limit_after_access_ends: 1 } }))).toBeNull();
    expect(planEndingNotice(null)).toBeNull();
  });
});

describe("helpers", () => {
  it("formats plan names, percentages and device slots", () => {
    expect(planShortName("personal.starter")).toBe("Starter");
    expect(planShortName(undefined)).toBe("Basic");
    expect(usagePercent(250, 1000)).toBe(25);
    expect(usagePercent(5, 0)).toBe(0);
    expect(usagePercent(2000, 1000)).toBe(100);
    expect(hasDeviceSlot(usage())).toBe(false);
    expect(hasDeviceSlot(usage({ vpn: { client_limit: 3, public_clients: 2, paused_clients: 0, limit_after_access_ends: 1 } }))).toBe(true);
    expect(hasDeviceSlot(null)).toBeNull();
  });
});
