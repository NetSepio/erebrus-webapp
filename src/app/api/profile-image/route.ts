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

/**
 * Accepts a profile image and adds it to IPFS, returning the bare CID. The
 * caller then PATCHes the CID onto the gateway profile — this route stores
 * nothing itself. Session check is presence-only (the PASETO can only be
 * verified by the gateway); the profile write is still gated by gateway auth.
 */
export async function POST(req: NextRequest) {
  if (!AUTH_COOKIES.some((name) => req.cookies.get(name)?.value)) {
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
