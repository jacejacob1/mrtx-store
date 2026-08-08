import "server-only";

/**
 * Server-only secrets.
 *
 * Importing `server-only` makes the build FAIL if any of this is ever
 * pulled into a client component. That is deliberate: leaking
 * RAZORPAY_KEY_SECRET or the Supabase service key into the browser
 * bundle would let anyone forge a paid order or read every customer
 * address, and it is exactly the kind of mistake that is invisible
 * until it isn't.
 *
 * Nothing here is read at module scope, so a missing variable surfaces
 * as a clean error on the one request that needs it rather than
 * crashing the whole deploy at boot.
 */

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing ${name}. Set it in Vercel → Settings → Environment Variables, then redeploy.`,
    );
  }
  return v;
}

export const env = {
  razorpayKeyId: () => need("RAZORPAY_KEY_ID"),
  razorpayKeySecret: () => need("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: () => need("RAZORPAY_WEBHOOK_SECRET"),

  supabaseUrl: () => need("SUPABASE_URL"),
  supabaseServiceKey: () => need("SUPABASE_SERVICE_ROLE_KEY"),

  shiprocketEmail: () => need("SHIPROCKET_EMAIL"),
  shiprocketPassword: () => need("SHIPROCKET_PASSWORD"),
  shiprocketPickup: () => process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",
} as const;

/**
 * Whether payment is wired at all. The checkout page asks this so it
 * can refuse loudly rather than opening a modal that cannot work.
 * §13: never promise something the system doesn't do.
 */
export const paymentsConfigured = (): boolean =>
  Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

/** Shipping can be wired later than payment without blocking a sale. */
export const shiprocketConfigured = (): boolean =>
  Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
