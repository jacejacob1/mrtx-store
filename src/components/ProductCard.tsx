import Link from "next/link";
import { Photo } from "@/components/Photo";
import { Price } from "@/components/Price";
import { DotText } from "@/components/DotText";
import type { Product } from "@/lib/catalogue";

/**
 * A product as a card: worn photograph, dot-matrix index, name, the
 * sentence, the price.
 *
 * On hover the second photograph crossfades in and the frame eases in
 * a few percent — opacity and transform only. On touch there is no
 * hover, so the first photo is chosen to carry the card on its own.
 */
export function ProductCard({
  product,
  sizes,
  eager = false,
}: {
  product: Product;
  sizes: string;
  eager?: boolean;
}) {
  const [first, second] = product.photos;

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-surface">
        <div className="absolute inset-0 transition-transform duration-[1200ms] ease-sheet group-hover:scale-[1.035]">
          <Photo
            id={first}
            alt={`${product.name} — worn`}
            sizes={sizes}
            fill
            eager={eager}
            className="object-cover"
          />
          {second && (
            <Photo
              id={second}
              alt=""
              sizes={sizes}
              fill
              className="object-cover opacity-0 transition-opacity duration-700 ease-sheet group-hover:opacity-100"
            />
          )}
        </div>
        <div className="absolute top-5 left-5 text-white mix-blend-difference">
          <DotText text={product.index} size={11} label={`Number ${product.index}`} />
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div>
          <h3 className="t-title">{product.name}</h3>
          <p className="t-small mt-1 text-fg-2">{product.tagline}</p>
        </div>
        <Price product={product} size="sm" />
      </div>
    </Link>
  );
}

export default ProductCard;
