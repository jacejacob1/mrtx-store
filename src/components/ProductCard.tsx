import Link from "next/link";
import { ProductMedia } from "@/components/ProductMedia";
import { formatINR } from "@/lib/money";
import { inStock, type Product } from "@/lib/products";

/**
 * §14: "Calm grid. Product name in sans, price in mono. No badges, no
 * SALE starbursts, no hover-zoom."
 *
 * The only hover affordance is the name shifting to full opacity —
 * enough to read as interactive, not enough to be a hover effect.
 */
export function ProductCard({ product }: { product: Product }) {
  const available = inStock(product);

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <ProductMedia materialId={product.material} alt={product.alt} />

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] tracking-[.02em] text-ink">
          {product.name}
        </h2>
        <p className="mono text-readout text-ink">
          {formatINR(product.price)}
        </p>
      </div>

      <p className="mt-1 text-[13px] text-mute">{product.tagline}</p>

      {/* §14: out of stock is stated, not hidden. */}
      {!available && (
        <p className="label mt-2 text-mute">SOLD OUT</p>
      )}
    </Link>
  );
}

export default ProductCard;
