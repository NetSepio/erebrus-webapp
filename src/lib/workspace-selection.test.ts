import { afterEach, describe, expect, it, vi } from "vitest";
import type { GatewayOrg } from "@/lib/gateway/types";
import {
  ACTIVE_WORKSPACE_KEY,
  pickSelectedWorkspace,
  readStoredWorkspaceId,
  storeWorkspaceId,
} from "./workspace-selection";

const org = (id: string, role = "member"): GatewayOrg => ({ id, name: id, kind: "team", verified: false, role });

describe("pickSelectedWorkspace", () => {
  const orgs = [org("basic-a"), org("starter", "owner"), org("basic-b", "owner")];

  it("keeps the stored workspace while the user is still a member", () => {
    expect(pickSelectedWorkspace(orgs, "basic-b", "starter")?.id).toBe("basic-b");
  });

  it("falls back to the plan's workspace, then an owned one, then the first", () => {
    expect(pickSelectedWorkspace(orgs, "gone", "starter")?.id).toBe("starter");
    expect(pickSelectedWorkspace(orgs, null, null)?.id).toBe("starter");
    expect(pickSelectedWorkspace([org("x"), org("y")], null)?.id).toBe("x");
  });

  it("returns null without workspaces", () => {
    expect(pickSelectedWorkspace([], "a")).toBeNull();
  });
});

describe("stored workspace id", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("persists and clears the selection in localStorage", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    storeWorkspaceId("starter");
    expect(store.get(ACTIVE_WORKSPACE_KEY)).toBe("starter");
    expect(readStoredWorkspaceId()).toBe("starter");
    storeWorkspaceId(null);
    expect(readStoredWorkspaceId()).toBeNull();
  });

  it("tolerates unavailable storage", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
      },
    });
    expect(readStoredWorkspaceId()).toBeNull();
    expect(() => storeWorkspaceId("x")).not.toThrow();
  });
});
