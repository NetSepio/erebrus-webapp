import { describe, expect, it } from "vitest";
import { isShareable, shareLabel } from "./share";

describe("Drop share labels", () => {
  it("only public-network public plaintext files are shareable", () => {
    expect(isShareable({ scope: "public", visibility: "public", encrypted: false })).toBe(true);
    expect(isShareable({ scope: "private", visibility: "public", encrypted: false })).toBe(false);
    expect(isShareable({ scope: "public", visibility: "private", encrypted: true })).toBe(false);
  });

  it("labels who can see the file", () => {
    expect(shareLabel({ scope: "public", visibility: "public", encrypted: false })).toBe("Anyone with the link");
    expect(shareLabel({ scope: "private", visibility: "public", encrypted: false })).toBe("Workspace only — not shareable");
    expect(shareLabel({ scope: "public", visibility: "private", encrypted: true })).toBe("Only you");
  });
});
