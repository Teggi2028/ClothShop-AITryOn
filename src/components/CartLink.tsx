"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cartCount, useCart, useHydrated } from "@/stores/cart";

export function CartLink() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <Link href="/cart" className="relative flex items-center" aria-label={`Giỏ hàng (${count} sản phẩm)`}>
      <ShoppingBag size={22} />
      <span className="absolute -top-1.5 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
        {count}
      </span>
    </Link>
  );
}
