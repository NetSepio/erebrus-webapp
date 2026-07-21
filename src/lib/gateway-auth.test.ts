import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_DESKTOP_AUTH_REDIRECT_URIS,
  buildAuthCallbackUrl,
  getAllowedDesktopAuthRedirectUris,
} from "./gateway-auth";

const originalEnv = process.env.NEXT_PUBLIC_ALLOWED_DESKTOP_AUTH_REDIRECT_URIS;

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.NEXT_PUBLIC_ALLOWED_DESKTOP_AUTH_REDIRECT_URIS;
  } else {
    process.env.NEXT_PUBLIC_ALLOWED_DESKTOP_AUTH_REDIRECT_URIS = originalEnv;
  }
});

describe("getAllowedDesktopAuthRedirectUris", () => {
  it("returns defaults when env is missing or empty", () => {
    delete process.env.NEXT_PUBLIC_ALLOWED_DESKTOP_AUTH_REDIRECT_URIS;
    expect(getAllowedDesktopAuthRedirectUris()).toEqual(
      DEFAULT_DESKTOP_AUTH_REDIRECT_URIS
    );
  });

  it("parses a comma-separated env override", () => {
    process.env.NEXT_PUBLIC_ALLOWED_DESKTOP_AUTH_REDIRECT_URIS =
      " custom://auth , other://auth ";
    expect(getAllowedDesktopAuthRedirectUris()).toEqual([
      "custom://auth",
      "other://auth",
    ]);
  });
});

describe("buildAuthCallbackUrl", () => {
  it("appends callback params to a desktop redirect URI", () => {
    const url = buildAuthCallbackUrl("erebrusvpn://auth", {
      token: "t",
      user_id: "u",
      state: "s",
    });
    const parsed = new URL(url);
    expect(parsed.protocol).toBe("erebrusvpn:");
    expect(parsed.searchParams.get("token")).toBe("t");
    expect(parsed.searchParams.get("user_id")).toBe("u");
    expect(parsed.searchParams.get("state")).toBe("s");
  });

  it("URL-encodes param values", () => {
    const url = buildAuthCallbackUrl("erebrusdrop://auth", {
      token: "a b&c=d",
    });
    expect(new URL(url).searchParams.get("token")).toBe("a b&c=d");
  });
});
