import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const { pathname } = request.nextUrl;

  // Don't intercept API routes or Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static assets (.js, .svg, .ico, etc.)
  ) {
    return NextResponse.next();
  }

  const hostname = host.toLowerCase().split(":")[0];

  // Subdomain routing
  if (
    hostname.startsWith("bd.") ||
    hostname === "agentix-bd.ilogicmagic.com" ||
    hostname.startsWith("bd-")
  ) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/bd", request.url));
    }
  } else if (hostname.startsWith("demo.")) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/demo", request.url));
    }
  } else if (hostname.startsWith("app.")) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

