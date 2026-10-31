"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { OrderSummary } from "@/components/OrderSummary";
import { formatPrice } from "@/lib/format";
import { MAX_QUANTITY, cartSubtotal, useCart, useHydrated } from "@/stores/cart";

export function CartView() {
  const { items, setQuantity, remove } = useCart();
  const hydrated = useHydrated();

  if (!hydrated) return <p className="py-24 text-center text-sm text-stone">Đang tải giỏ hàng…</p>;

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone">Giỏ hàng của bạn đang trống.</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_400px]">
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.key} className="grid grid-cols-[110px_1fr_auto] gap-6 py-6">
            <Link href={`/product/${item.slug}`} className="relative aspect-[4/5] bg-sand">
              <Image src={item.image} alt={item.name} fill unoptimized className="object-contain p-3" />
            </Link>
            <div>
              <Link href={`/product/${item.slug}`} className="font-serif text-xl hover:text-gold-deep">
                {item.name}
              </Link>
              <p className="mt-1 text-sm text-stone">
                {item.colorName} · Size {item.size}
              </p>
              <p className="mt-2 text-sm">{formatPrice(item.price)}</p>
              <div className="mt-4 flex h-10 w-fit items-center border border-line">
                <button className="grid h-full w-10 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.key, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Giảm số lượng">
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button className="grid h-full w-10 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= MAX_QUANTITY} aria-label="Tăng số lượng">
                  <Plus size={13} />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button onClick={() => remove(item.key)} className="text-stone hover:text-danger" aria-label={`Xoá ${item.name}`}>
                <X size={18} strokeWidth={1.4} />
              </button>
              <p className="font-serif text-lg">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="lg:sticky lg:top-36 lg:self-start">
        <OrderSummary subtotal={cartSubtotal(items)}>
          <Link href="/checkout" className="btn btn-primary mt-8 w-full">
            Tiến hành đặt hàng
          </Link>
          <Link href="/shop" className="link-underline mx-auto mt-5 block w-fit text-xs text-stone">
            Tiếp tục mua sắm
          </Link>
        </OrderSummary>
      </div>
    </div>
  );
}
