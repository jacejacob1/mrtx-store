import { formatINR, discount } from "@/lib/money";
import type { Product } from "@/lib/catalogue";

/**
 * The launch price, stated rather than shouted: live price in fg, the
 * MRP struck through in fg-2, the saving in mono. No badge, no
 * starburst — a fact, said quietly, in the brand's own voice.
 */
export function Price({ product, size = "md" }: { product: Product; size?: "sm" | "md" | "lg" }) {
  const off = discount(product.price, product.mrp);
  const px = size === "lg" ? 24 : size === "md" ? 17 : 14;

  return (
    <span className="t-num inline-flex items-baseline gap-2 whitespace-nowrap">
      <span style={{ fontSize: px }} className="text-fg">
        {formatINR(product.price)}
      </span>
      {off && product.mrp !== null && (
        <>
          <s className="text-fg-2" style={{ fontSize: Math.round(px * 0.8) }}>
            <span className="sr-only">was </span>
            {formatINR(product.mrp)}
          </s>
          <span className="text-accent" style={{ fontSize: Math.round(px * 0.72) }}>
            −{off.percent}%
          </span>
        </>
      )}
    </span>
  );
}

export default Price;
