import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "sinet_admin_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isLoggedIn = request.cookies.get(ADMIN_COOKIE_NAME)?.value === "true";

    if (!isLoggedIn) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};