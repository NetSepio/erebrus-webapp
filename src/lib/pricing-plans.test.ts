import { describe, expect, it } from "vitest";
import { COMPARISON_ROWS, PRICING_PLANS } from "./pricing-plans";
import { deviceLimitForTier } from "./entitlements";

const starter = PRICING_PLANS.find((p) => p.id === "personal.starter")!;

describe("Starter launch copy", () => {
  it("only promises what the gateway enforces", () => {
    const text = [starter.description, ...starter.includes, COMPARISON_ROWS.find((r) => r.planId === "personal.starter")!.keyIncludes]
      .join(" ")
      .toLowerCase();
    for (const unshipped of ["faster", "bandwidth", "ai service", "build your vpn app"]) {
      expect(text).not.toContain(unshipped);
    }
  });

  it("states the device limit the gateway and webapp agree on", () => {
    expect(starter.includes).toContain(`${deviceLimitForTier("starter")} VPN devices on public nodes`);
    expect(starter.ctaEnabled).toBe(true);
  });
});
