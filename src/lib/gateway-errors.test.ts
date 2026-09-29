import { describe, expect, it } from "vitest";
import { GatewayApiError } from "@/lib/gateway/client";
import { describeGatewayError, gatewayErrorCode } from "./gateway-errors";

function apiError(status: number, code?: string, details?: Record<string, unknown>, message = "raw") {
  return new GatewayApiError(message, status, { error: message, ...(code ? { code } : {}), ...(details ? { details } : {}) });
}

describe("gatewayErrorCode", () => {
  it("reads the machine code from the gateway body", () => {
    expect(gatewayErrorCode(apiError(409, "VPN_DEVICE_LIMIT"))).toBe("VPN_DEVICE_LIMIT");
    expect(gatewayErrorCode(apiError(409))).toBeNull();
    expect(gatewayErrorCode(new Error("x"))).toBeNull();
  });
});

describe("describeGatewayError", () => {
  it("explains the device limit with used/limit and offers remove + upgrade", () => {
    const d = describeGatewayError(apiError(409, "VPN_DEVICE_LIMIT", { limit: 3, used: 3, plan_id: "personal.starter" }));
    expect(d.message).toBe("Device limit reached (3/3). Remove a device or upgrade your plan.");
    expect(d.actions).toEqual(["remove_device", "upgrade"]);
  });

  it("distinguishes draining nodes and idempotency conflicts from device limits", () => {
    expect(describeGatewayError(apiError(409, "NODE_DRAINING")).actions).toEqual(["pick_node"]);
    expect(describeGatewayError(apiError(409, "IDEMPOTENCY_CONFLICT")).actions).toEqual(["retry"]);
    expect(describeGatewayError(apiError(409, "NODE_DRAINING")).message).not.toMatch(/limit/i);
  });

  it("maps paused devices, seats, API keys, plan-gated services and billing", () => {
    expect(describeGatewayError(apiError(409, "VPN_DEVICE_PAUSED")).actions).toEqual(["remove_device", "upgrade"]);
    expect(describeGatewayError(apiError(409, "SEAT_LIMIT")).message).toMatch(/Starter includes only the owner's seat/);
    expect(describeGatewayError(apiError(403, "API_KEY_PLAN_REQUIRED")).actions).toEqual(["upgrade"]);
    expect(describeGatewayError(apiError(402, "PLAN_REQUIRED")).actions).toEqual(["upgrade"]);
    expect(describeGatewayError(apiError(409, "BILLING_ALREADY_SUBSCRIBED")).message).toMatch(/another workspace/);
    expect(describeGatewayError(apiError(402, "BILLING_ACCESS_REQUIRED")).message).toMatch(/billing/i);
  });

  it("maps Drop quota and file-size errors", () => {
    expect(describeGatewayError(apiError(409, "DROP_QUOTA_EXCEEDED")).actions).toEqual(["upgrade"]);
    expect(describeGatewayError(apiError(413, "DROP_FILE_TOO_LARGE", { max_file_bytes: 1_000_000_000 })).message).toMatch(/1 GB/);
  });

  it("falls back by status, then to the gateway message", () => {
    expect(describeGatewayError(apiError(401)).actions).toEqual(["signin"]);
    expect(describeGatewayError(apiError(503)).actions).toEqual(["retry"]);
    expect(describeGatewayError(apiError(400, undefined, undefined, "name is required")).message).toBe("name is required");
    expect(describeGatewayError(new TypeError("Failed to fetch")).actions).toEqual(["retry"]);
  });
});
