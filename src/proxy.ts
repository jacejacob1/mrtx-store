import { NextResponse, type NextRequest } from "next/server";
import { ACCESS, REFRESH, REFRESH_MAX_AGE, cookieOptions, refreshSession } from "@/lib/server/admin-session";

/**
 * Runs before every /admin request (and nothing else — the shop never
 * passes through here).
 *
 *   - No session → the login screen.
 *   - Access token expired but refresh token still good → quietly renew
 *     both, so the client isn't logged out every hour.
 *   - Always: tell search engines not to index anything under /admin.
 *
 * This is the convenience layer. The real check is requireAdmin() in
 * every admin page and action, which verifies with Supabase.
 */

/** Seconds until a JWT expires (0 if unreadable). Not a security check — just "renew soon?". */
function secondsLeft(jwt: string) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
    return payload.exp - Math.floor(Date.now() / 1000);
  } catch {
    return 0;
  }
}

export async function proxy(req: NextRequest) {
  const isLogin = req.nextUrl.pathname === "/admin/login";
  const access = req.cookies.get(ACCESS)?.value;
  const refresh = req.cookies.get(REFRESH)?.value;

  const noindex = (res: NextResponse) => {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  if (isLogin || (access && secondsLeft(access) > 60)) return noindex(NextResponse.next());

  if (refresh) {
    const s = await refreshSession(refresh).catch(() => null);
    if (s) {
      // Hand the new token to this same request's render, and to the browser.
      req.cookies.set(ACCESS, s.access_token);
      const res = NextResponse.next({ request: { headers: req.headers } });
      res.cookies.set(ACCESS, s.access_token, cookieOptions(s.expires_in));
      res.cookies.set(REFRESH, s.refresh_token, cookieOptions(REFRESH_MAX_AGE));
      return noindex(res);
    }
  }

  const to = new URL("/admin/login", req.url);
  const res = NextResponse.redirect(to);
  res.cookies.delete({ name: ACCESS, path: "/admin" });
  res.cookies.delete({ name: REFRESH, path: "/admin" });
  return noindex(res);
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
