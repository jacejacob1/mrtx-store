import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";
import { Price } from "@/components/Price";
import { inStock, type Product } from "@/lib/products";

/**
 * §14: "Calm grid. Product name in sans, price in mono. No badges, no
 * SALE starbursts, no hover-zoom."
 *
 * The launch price is stated, not badged — struck MRP in mute, live
 * price in ink, no colour spent on it. See Price.tsx for why that is
 * the resolution rather than a discount badge.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const available = inStock(product);

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <ProductArt
        product={product}
        priority={priority}
        sizes="(min-width: 768px) 46vw, 92vw"
      />

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] tracking-[.02em] text-ink">
          {product.name}
        </h2>
        <Price product={product} size="sm" />
      </div>

      <p className="mt-1 text-[13px] text-mute">{product.tagline}</p>

      {/* §14: out of stock is stated, not hidden. */}
      {!available && <p className="label mt-2 text-mute">SOLD OUT</p>}
    </Link>
  );
}

export default ProductCard;
