import { NextRequest, NextResponse } from "next/server";

function gatewayBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_EREBRUS_BASE_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "https://gateway.erebrus.io";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const target = new URL(`api/v2/${path}`, gatewayBase());
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("X-Erebrus-Client", "webapp");

  const auth = request.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);

  const apiKey = request.headers.get("x-api-key");
  if (apiKey) headers.set("X-Api-Key", apiKey);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const res = await fetch(target.toString(), init);
  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(request, path);
}