import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidEvmAddress,
  isValidSolanaAddress,
  isValidWalletAddress,
} from "./validation";

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });

  it("rejects malformed or empty input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a @b.com")).toBe(false);
  });
});

describe("isValidEvmAddress", () => {
  it("accepts a 20-byte hex address", () => {
    expect(isValidEvmAddress("0x" + "a".repeat(40))).toBe(true);
    expect(isValidEvmAddress("0x52908400098527886E0F7030069857D2E4169EE7")).toBe(true);
  });

  it("rejects wrong length or non-hex", () => {
    expect(isValidEvmAddress("0x123")).toBe(false);
    expect(isValidEvmAddress("0x" + "g".repeat(40))).toBe(false);
    expect(isValidEvmAddress("a".repeat(40))).toBe(false);
  });
});

describe("isValidSolanaAddress", () => {
  it("accepts a base58 address in the valid length range", () => {
    expect(isValidSolanaAddress("11111111111111111111111111111111")).toBe(true);
    expect(
      isValidSolanaAddress("So11111111111111111111111111111111111111112")
    ).toBe(true);
  });

  it("rejects too-short, too-long, or non-base58 strings", () => {
    expect(isValidSolanaAddress("short")).toBe(false);
    expect(isValidSolanaAddress("0".repeat(32))).toBe(false); // 0 not in base58 alphabet
    expect(isValidSolanaAddress("I".repeat(32))).toBe(false); // I excluded
    expect(isValidSolanaAddress("1".repeat(45))).toBe(false); // too long
  });
});

describe("isValidWalletAddress", () => {
  it("dispatches by chain", () => {
    expect(isValidWalletAddress("0x" + "a".repeat(40), "evm")).toBe(true);
    expect(isValidWalletAddress("0x" + "a".repeat(40), "sol")).toBe(false);
    expect(
      isValidWalletAddress("11111111111111111111111111111111", "sol")
    ).toBe(true);
  });
});
