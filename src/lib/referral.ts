/**
 * Referral-code capture for signup attribution. A visitor landing with
 * `?ref=CODE` (or typing a code into the sign-in modal) has it kept in
 * localStorage; every login path (wallet / email / Google / Apple) sends it as
 * `ref`, and the gateway binds it once on first signup. Cleared after a
 * successful login that sent it.
 */

const KEY = "erebrus_ref";

/** Remember `?ref=CODE` from the current URL, if present. */
export function captureReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (code) window.localStorage.setItem(KEY, code.toUpperCase());
  } catch {
    /* storage unavailable */
  }
}

export function storedReferralCode(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) window.localStorage.setItem(KEY, trimmed);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export function clearReferralCode(): void {
  setStoredReferralCode("");
}
