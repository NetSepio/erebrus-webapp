import { describe, expect, it } from "vitest";
import {
  ALLOWED_DESKTOP_AUTH_REDIRECT_URI,
  buildAuthCallbackUrl,
} from "./gateway-auth";

describe("buildAuthCallbackUrl", () => {
  it("appends callback params to the allowed desktop redirect URI", () => {
    const url = buildAuthCallbackUrl(ALLOWED_DESKTOP_AUTH_REDIRECT_URI, {
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
    const url = buildAuthCallbackUrl(ALLOWED_DESKTOP_AUTH_REDIRECT_URI, {
      token: "a b&c=d",
    });
    expect(new URL(url).searchParams.get("token")).toBe("a b&c=d");
  });
});
