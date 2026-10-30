/**
 * The bits of admin auth that src/proxy.ts needs. Kept free of
 * next/headers and React so the proxy stays small.
 */
export const ACCESS = "mrtx_admin_at";
export const REFRESH = "mrtx_admin_rt";
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session = { access_token: string; refresh_token: string; expires_in: number };

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
  maxAge,
});

export function authHeaders(bearer?: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — see .env.example");
  return {
    apikey: key,
    "Content-Type": "application/json",
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
  };
}

/** Trade a refresh token for a fresh session. */
export async function refreshSession(refresh_token: string): Promise<Session | null> {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token }),
    cache: "no-store",
  });
  return res.ok ? ((await res.json()) as Session) : null;
}
