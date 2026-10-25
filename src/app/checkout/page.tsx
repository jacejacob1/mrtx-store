import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Check out", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section data-ground="light" className="px-5 pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-[1240px]">
        <CheckoutView />
      </div>
    </section>
  );
}
