import { NextRequest, NextResponse } from "next/server";
import { MAX_PROFILE_IMAGE_BYTES } from "@/lib/ipfs";

// IPFS node HTTP API (Kubo). Local daemon for now; point at a hosted node later.
const IPFS_API_URL = process.env.IPFS_API_URL ?? "http://127.0.0.1:5001";

const AUTH_COOKIES = [
  "erebrus_token_solana",
  "erebrus_token_evm",
  "erebrus_session_token",
  "erebrus_token",
];

function gatewayBase(): string {
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ?? "https://gateway.erebrus.io/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/** True only when the gateway accepts one of the caller's session cookies. */
async function hasValidSession(req: NextRequest): Promise<boolean> {
  const tokens = AUTH_COOKIES.map((name) => req.cookies.get(name)?.value).filter((t): t is string => !!t);
  for (const token of new Set(tokens)) {
    try {
      const res = await fetch(new URL("api/v2/account/profile", gatewayBase()), {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "X-Erebrus-Client": "webapp" },
        cache: "no-store",
      });
      if (res.ok) return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Accepts a profile image and adds it to IPFS, returning the bare CID. The
 * caller then PATCHes the CID onto the gateway profile — this route stores
 * nothing itself. The session is verified with the gateway first so anonymous
 * callers cannot pin arbitrary files to the IPFS node.
 */
export async function POST(req: NextRequest) {
  if (!(await hasValidSession(req))) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach an image as the `file` field" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 415 });
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be smaller than 5MB" }, { status: 413 });
  }

  const ipfsForm = new FormData();
  ipfsForm.append("file", file, file.name || "profile-image");

  let res: Response;
  try {
    res = await fetch(`${IPFS_API_URL}/api/v0/add?cid-version=1&pin=true`, {
      method: "POST",
      body: ipfsForm,
    });
  } catch {
    return NextResponse.json(
      { error: "IPFS node is unreachable — is the daemon running?" },
      { status: 502 }
    );
  }
  if (!res.ok) {
    return NextResponse.json({ error: `IPFS add failed (${res.status})` }, { status: 502 });
  }

  const payload = (await res.json()) as { Hash?: string };
  if (!payload.Hash) {
    return NextResponse.json({ error: "IPFS add returned no hash" }, { status: 502 });
  }

  return NextResponse.json({ cid: payload.Hash });
}
