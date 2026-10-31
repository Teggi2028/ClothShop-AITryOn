"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cartCount, useCart, useHydrated } from "@/stores/cart";

export function CartLink() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <Link href="/cart" className="relative flex items-center gap-2" aria-label={`Giỏ hàng (${count} sản phẩm)`}>
      <ShoppingBag size={20} strokeWidth={1.4} />
      {count > 0 && (
        <span className="absolute -right-2.5 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-medium text-noir">
          {count}
        </span>
      )}
    </Link>
  );
}
