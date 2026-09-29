import { describe, expect, it } from "vitest";
import { activityNotificationId, planNotificationCopy } from "./notifications";

describe("plan notifications", () => {
  it("describes pause, restore and access-ending events with a link to devices", () => {
    expect(planNotificationCopy("vpn.client.plan_pause")).toMatchObject({ title: "A VPN device was paused", href: "/connect" });
    expect(planNotificationCopy("vpn.client.plan_restore").detail).toMatch(/download its config again/);
    expect(planNotificationCopy("plan.access_ending").title).toBe("Your plan is ending soon");
    expect(planNotificationCopy("other").href).toBe("/profile/activity");
  });

  it("namespaces activity ids apart from invites", () => {
    expect(activityNotificationId("42")).toBe("activity:42");
  });
});
