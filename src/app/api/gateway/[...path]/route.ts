import { NextRequest, NextResponse } from "next/server";

function gatewayBase(): string {
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ?? "https://gateway.erebrus.io/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  // Reject traversal segments so a crafted path can't resolve outside `api/v2/`
  // on the gateway host.
  if (pathSegments.some((seg) => seg === ".." || seg === ".")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const path = pathSegments.join("/");
  const target = new URL(`api/v2/${path}`, gatewayBase());
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set("Accept", request.headers.get("accept") || "application/json");
  headers.set("X-Erebrus-Client", "webapp");

  const auth = request.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);

  const apiKey = request.headers.get("x-api-key");
  if (apiKey) headers.set("X-Api-Key", apiKey);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const contentLength = request.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Stream the request body straight through so large Drop uploads never get
    // buffered entirely in memory here. `duplex: "half"` is required by fetch
    // when the body is a stream.
    init.body = request.body;
    init.duplex = "half";
  }

  const res = await fetch(target.toString(), init as RequestInit);
  // 204/205/304 are null-body statuses — constructing a Response with a body
  // for them throws, turning successful DELETEs into 500s.
  const nullBody = res.status === 204 || res.status === 205 || res.status === 304;

  // Stream the response body through unchanged (Drop downloads are large), and
  // forward the headers a client needs to interpret the payload.
  const outHeaders = new Headers();
  outHeaders.set("Content-Type", res.headers.get("Content-Type") || "application/json");
  for (const h of ["Content-Length", "Content-Disposition", "ETag", "Cache-Control", "Content-Range", "Accept-Ranges", "Content-Security-Policy", "X-Content-Type-Options"]) {
    const v = res.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  const location = res.headers.get("Location");
  if (location) {
    outHeaders.set(
      "Location",
      location.startsWith("/api/v2/")
        ? `/api/gateway/${location.slice("/api/v2/".length)}`
        : location
    );
  }

  return new NextResponse(nullBody ? null : res.body, {
    status: res.status,
    headers: outHeaders,
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

export async function PUT(
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