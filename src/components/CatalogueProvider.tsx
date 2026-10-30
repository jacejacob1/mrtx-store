"use client";

import { createContext, useContext } from "react";
import { PRODUCTS, type Product } from "@/lib/catalogue";

/**
 * The live catalogue, handed from the server layout to every client
 * component (bag, checkout, cards) so they show what the dashboard
 * last saved — not what was written in code.
 */
const Ctx = createContext<readonly Product[]>(PRODUCTS);

export function CatalogueProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  return <Ctx.Provider value={products}>{children}</Ctx.Provider>;
}

export const useCatalogue = () => useContext(Ctx);
