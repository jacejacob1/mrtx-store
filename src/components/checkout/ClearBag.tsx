"use client";

import { useEffect } from "react";
import { clearBag } from "@/lib/cart";

/** Empties the bag once an order is confirmed. Renders nothing. */
export function ClearBag() {
  useEffect(() => {
    clearBag();
  }, []);
  return null;
}
