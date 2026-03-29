import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  // Let next-intl handle locale routing first
  const response = intlMiddleware(request);

  // Only protect dashboard routes that have a valid token
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("hl_access_token")?.value;
  const isDashboardRoute = pathname.includes("/dashboard");

  if (isDashboardRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for static files and API routes
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ]
};
