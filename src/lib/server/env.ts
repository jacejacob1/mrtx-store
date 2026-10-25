/**
 * Server-only secrets. Never import this from a "use client" file —
 * none of these may reach the browser bundle. Values live in .env.local
 * (on your Mac) and in Vercel → Settings → Environment Variables.
 */
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} — see .env.example`);
  return v;
}

export const env = {
  get supabaseUrl() {
    return need("SUPABASE_URL");
  },
  get supabaseServiceKey() {
    return need("SUPABASE_SERVICE_ROLE_KEY");
  },
  get razorpayKeyId() {
    return need("RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return need("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return need("RAZORPAY_WEBHOOK_SECRET");
  },
};

/** True when the database is configured — lets pages fall back to catalogue stock in local dev. */
export const hasDb = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
