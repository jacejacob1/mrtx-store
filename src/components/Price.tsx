import { formatINR, discount } from "@/lib/money";
import type { Product } from "@/lib/products";

/**
 * §3: prices are things the machine knows, so mono, always.
 * §14: no badges, no SALE starbursts. The MRP is struck through in
 * `mute` and the live price sits in `ink` — a fact stated quietly, not
 * a device. No colour is spent on it; §2's blue is needed elsewhere.
 */
export function Price({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md" | "lg";
}) {
  const off = discount(product.price, product.mrp);
  const px = size === "lg" ? 22 : size === "md" ? 15 : 13;

  return (
    <span className="mono inline-flex items-baseline gap-2.5 whitespace-nowrap">
      <span style={{ fontSize: px }}>{formatINR(product.price)}</span>
      {off && product.mrp !== null && (
        <>
          <s
            className="text-mute"
            style={{ fontSize: Math.round(px * 0.8) }}
            // Screen readers announce <s> inconsistently; say it plainly.
            aria-label={`was ${formatINR(product.mrp)}`}
          >
            {formatINR(product.mrp)}
          </s>
          <span
            className="text-mute"
            style={{ fontSize: Math.round(px * 0.72) }}
          >
            −{off.percent}%
          </span>
        </>
      )}
    </span>
  );
}

export default Price;
