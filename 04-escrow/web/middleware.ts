import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("escrow_session_v1")?.value;
  const { pathname } = request.nextUrl;

  // Dashboard sin sesión → landing
  if (pathname.startsWith("/dashboard") && session !== "active") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Landing con sesión activa → dashboard
  if (pathname === "/" && session === "active") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
