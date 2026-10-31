"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { OrderSummary } from "@/components/OrderSummary";
import { formatPrice } from "@/lib/format";
import { MAX_QUANTITY, cartSubtotal, useCart, useHydrated } from "@/stores/cart";

export function CartView() {
  const { items, setQuantity, remove } = useCart();
  const hydrated = useHydrated();

  if (!hydrated) return <p className="py-24 text-center text-sm text-muted">Đang tải giỏ hàng…</p>;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <ShoppingBag className="mx-auto text-line" size={64} strokeWidth={1} />
        <p className="mt-4 text-muted">Giỏ hàng của bạn đang trống.</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-line rounded-md border border-line px-5">
        {items.map((item) => (
          <li key={item.key} className="grid grid-cols-[90px_1fr_auto] gap-4 py-5">
            <Link href={`/product/${item.slug}`} className="relative aspect-[37/48] overflow-hidden bg-surface">
              <Image src={item.image} alt={item.name} fill unoptimized className={item.image.endsWith(".svg") ? "object-contain p-2" : "object-cover"} />
            </Link>
            <div>
              <Link href={`/product/${item.slug}`} className="font-semibold hover:text-accent">
                {item.name}
              </Link>
              <p className="mt-1 text-[13px] text-muted">
                {item.colorName} / {item.size}
              </p>
              <p className="mt-1 font-bold text-sale">{formatPrice(item.price)}</p>
              <div className="mt-3 flex h-9 w-fit items-center rounded border border-line">
                <button className="grid h-full w-9 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.key, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Giảm số lượng">
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button className="grid h-full w-9 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= MAX_QUANTITY} aria-label="Tăng số lượng">
                  <Plus size={13} />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button onClick={() => remove(item.key)} className="text-subtle hover:text-sale" aria-label={`Xoá ${item.name}`}>
                <Trash2 size={18} />
              </button>
              <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="lg:sticky lg:top-32 lg:self-start">
        <OrderSummary subtotal={cartSubtotal(items)}>
          <Link href="/checkout" className="btn btn-primary mt-6 w-full uppercase">
            Tiến hành đặt hàng
          </Link>
          <Link href="/shop" className="mt-4 block text-center text-sm text-accent hover:underline">
            Tiếp tục mua sắm
          </Link>
        </OrderSummary>
      </div>
    </div>
  );
}
