import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from "../../../../lib/admin-session";
import { authOptions } from "../../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { path: string[] } };

async function proxyRequest(request: NextRequest, { params }: RouteContext) {
  const internalSecret = process.env.API_INTERNAL_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const apiBaseUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  if (!internalSecret) {
    return NextResponse.json(
      { message: "Internal API authentication is not configured." },
      { status: 503 },
    );
  }

  const path = params.path.map((part) => encodeURIComponent(part)).join("/");
  const isAdminRequest =
    path === "api/admin" || path.startsWith("api/admin/");
  const url = new URL(
    `${path}${request.nextUrl.search}`,
    `${apiBaseUrl.replace(/\/+$/, "")}/`,
  );

  const headers = new Headers({
    "x-agentix-internal-token": internalSecret,
    accept: request.headers.get("accept") || "application/json",
  });
  let body: BodyInit | undefined;

  if (isAdminRequest) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!adminPassword || !isValidAdminSessionToken(adminToken)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    headers.set("x-admin-key", adminPassword);
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
      const contentType = request.headers.get("content-type");
      if (contentType) headers.set("content-type", contentType);
    }
  } else {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    url.searchParams.set("email", email);
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.delete("email");
      formData.append("email", email);
      body = formData;
    } else if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      contentType.includes("application/json")
    ) {
      const payload: unknown = await request.json().catch(() => null);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return NextResponse.json(
          { message: "A JSON object body is required." },
          { status: 400 },
        );
      }
      headers.set("content-type", "application/json");
      body = JSON.stringify({ ...payload, email });
    } else if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
      if (contentType) headers.set("content-type", contentType);
    }
  }

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    const responseContentType = upstream.headers.get("content-type");
    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy request failed:", error);
    return NextResponse.json(
      { message: "The API service is unavailable." },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
