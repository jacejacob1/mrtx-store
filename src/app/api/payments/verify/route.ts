import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCheckoutSignature } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirms the browser's claim that it paid — for the redirect ONLY.
 *
 * This does not mark anything paid, decrement stock or ship anything.
 * All of that belongs to the webhook, which is the only party that
 * actually heard it from Razorpay. This endpoint exists so the customer
 * can be sent to a confirmation page immediately instead of watching a
 * spinner until a webhook lands.
 *
 * It still verifies the signature. Without that, anyone could POST a
 * made-up payment id and reach someone else's order page.
 */
export async function POST(req: Request) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let valid = false;
  try {
    valid = verifyCheckoutSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!valid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { data } = await db()
    .from("orders")
    .select("id, order_no")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();

  if (!data) return NextResponse.json({ ok: false }, { status: 404 });

  return NextResponse.json({ ok: true, orderId: data.id });
}
