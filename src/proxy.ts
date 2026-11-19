import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Everything is private except the login page/API and the static PWA files.
// /api/cron checks CRON_SECRET itself; /sw.js must be fetchable for push notifications.
const PUBLIC = ["/login", "/api/login", "/setup", "/api/setup", "/manifest.webmanifest", "/sw.js", "/api/cron"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();

  // Not set up yet: send everything to the setup page.
  const configured =
    (process.env.AUTH_PASSWORD_HASH ?? "").startsWith("scrypt:") && (process.env.SESSION_SECRET ?? "").length >= 32;
  if (!configured) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not set up" }, { status: 503 });
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and static assets (icons, images).
  matcher: ["/((?!_next/static|_next/image|icons/|favicon.ico|apple-touch-icon.png|.*\\.png$).*)"],
};
