import { NextRequest, NextResponse } from "next/server";

function gatewayBase(): string {
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ?? "https://gateway.erebrus.io/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

async function proxyKubo(request: NextRequest, pathSegments: string[]) {
  const sessionId = request.cookies.get("erebrus_drop_webui")?.value ?? "";
  if (!/^[A-Fa-f0-9]{48}$/.test(sessionId)) {
    return NextResponse.json({ error: "Drop WebUI session expired" }, { status: 401 });
  }
  if (pathSegments.some((segment) => segment === "." || segment === "..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const target = new URL(
    `api/v2/drop/webui/${sessionId}/api/v0/${pathSegments.join("/")}`,
    gatewayBase()
  );
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const headers = new Headers();
  for (const name of ["accept", "content-type", "content-length"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  const response = await fetch(target, init as RequestInit);
  const outHeaders = new Headers();
  for (const name of ["content-type", "content-length", "cache-control", "etag"]) {
    const value = response.headers.get(name);
    if (value) outHeaders.set(name, value);
  }
  return new NextResponse(response.body, {
    status: response.status,
    headers: outHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyKubo(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyKubo(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyKubo(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyKubo(request, (await context.params).path);
}
