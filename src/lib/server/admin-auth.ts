import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/server/env";
import { select } from "@/lib/server/db";
import {
  ACCESS,
  REFRESH,
  REFRESH_MAX_AGE,
  authHeaders,
  cookieOptions,
  refreshSession,
  type Session,
} from "@/lib/server/admin-session";

/**
 * Admin sessions, on Supabase Auth, without a client library.
 *
 *   - Accounts live in Supabase → Authentication → Users (email + password).
 *   - Being an *admin* means also being listed in public.admins. An
 *     account that isn't on that list can't get in, even with a valid
 *     password.
 *   - The session is two httpOnly cookies scoped to /admin: page scripts
 *     can't read them, and the shop never sends them.
 *   - Every admin page AND every admin action calls requireAdmin(),
 *     which asks Supabase who the token belongs to — nothing is trusted
 *     from the browser. Hiding the page is not the security; this is.
 */

export { ACCESS, REFRESH, REFRESH_MAX_AGE, cookieOptions, refreshSession, type Session };

/** Exchange email + password for a session. Null on bad credentials. */
export async function passwordLogin(email: string, password: string): Promise<Session | null> {
  const res = await fetch(`${env.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  return res.ok ? ((await res.json()) as Session) : null;
}

export async function revokeSession(access_token: string) {
  await fetch(`${env.supabaseUrl}/auth/v1/logout`, {
    method: "POST",
    headers: authHeaders(access_token),
    cache: "no-store",
  }).catch(() => {});
}

/** Who does this token belong to, according to Supabase? */
async function emailFor(access_token: string): Promise<string | null> {
  const res = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: authHeaders(access_token),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const u = (await res.json()) as { email?: string };
  return u.email?.toLowerCase() ?? null;
}

export async function isAdminEmail(email: string) {
  const rows = await select<{ email: string }[]>("admins", `email=eq.${encodeURIComponent(email)}&select=email`);
  return rows.length === 1;
}

/** The signed-in admin, or null. Checked once per request. */
export const currentAdmin = cache(async (): Promise<{ email: string } | null> => {
  const token = (await cookies()).get(ACCESS)?.value;
  if (!token) return null;
  const email = await emailFor(token);
  if (!email || !(await isAdminEmail(email))) return null;
  return { email };
});

/** Gate for every admin page and action. Sends anyone else to the login screen. */
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
