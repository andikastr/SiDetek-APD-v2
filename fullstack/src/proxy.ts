import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets, internal Next.js files, and icons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Extract session token
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  // 3. Define public routes: Root overview ("/") and Login ("/login")
  const isPublicPage = pathname === "/" || pathname === "/login";
  const isPublicApi = pathname.startsWith("/api/auth") || pathname === "/api/analytics";

  // If user is already authenticated and visits /login, redirect to overview /
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow public access to / and /login and public APIs
  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // 4. Protected routes (/detect, /history, /analytics, /api/history, /api/detect, etc.)
  if (!user) {
    // For protected API requests, return 401 Unauthorized
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Please login first." },
        { status: 401 }
      );
    }

    // For web pages, redirect to /login with redirect query param
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
