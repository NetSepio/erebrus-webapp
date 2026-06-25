import { NextRequest, NextResponse } from "next/server";

function gatewayBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_EREBRUS_BASE_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "http://212.147.232.36:8080";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export async function GET(request: NextRequest) {
  const target = `${gatewayBase()}api/v2/auth${request.nextUrl.search}`;
  const res = await fetch(target, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
    },
  });
}

export async function POST(request: NextRequest) {
  const target = `${gatewayBase()}api/v2/auth`;
  const res = await fetch(target, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: await request.text(),
    cache: "no-store",
  });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
    },
  });
}