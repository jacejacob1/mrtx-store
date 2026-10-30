import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { DotText } from "@/components/DotText";
import { select } from "@/lib/server/db";
import { rowToProduct, type ProductRow } from "@/lib/server/catalogue";
import { formatINR } from "@/lib/money";
import { SIZES } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsAdmin() {
  const rows = await select<ProductRow[]>("products", "order=sort.asc&select=*,variants(size,stock)");
  const products = rows.map(rowToProduct);

  return (
    <>
      <h1 className="t-display">Products.</h1>
      <p className="t-body mt-2 text-fg-2">Tap a tee to change its name, words, price, stock or photos.</p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const total = SIZES.reduce((n, s) => n + p.stock[s], 0);
          const out = SIZES.filter((s) => p.stock[s] === 0);
          return (
            <li key={p.slug}>
              <Link href={`/admin/products/${p.slug}`} className="group block rounded-[24px] bg-surface p-3">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
                  <Photo
                    media={p.photos[0]}
                    alt=""
                    sizes="(min-width: 1024px) 400px, 50vw"
                    fill
                    className="object-cover transition-transform duration-700 ease-sheet group-hover:scale-[1.03]"
                  />
                  <div className="absolute top-4 left-4 text-white mix-blend-difference">
                    <DotText text={p.index} size={10} label="" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-3 px-2 pt-4 pb-2">
                  <div>
                    <p className="t-title">{p.name}</p>
                    <p className="t-small text-fg-2">
                      {total} in stock{out.length ? ` · ${out.join(", ")} sold out` : ""}
                    </p>
                  </div>
                  <p className="t-num t-body">{formatINR(p.price)}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
