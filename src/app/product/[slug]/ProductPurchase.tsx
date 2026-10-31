"use client";

import { Camera, Check, Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SHIPPING } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { MAX_QUANTITY, useCart } from "@/stores/cart";

export type PurchaseProduct = {
  id: number;
  slug: string;
  name: string;
  categoryName: string;
  description: string;
  material: string;
  price: number;
  compareAtPrice: number | null;
  sizes: string[];
  colors: { key: string; name: string; hex: string; image: string }[];
};

export function ProductPurchase({ product }: { product: PurchaseProduct }) {
  const [colorKey, setColorKey] = useState(product.colors[0].key);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const add = useCart((s) => s.add);

  const color = product.colors.find((c) => c.key === colorKey) ?? product.colors[0];

  function handleAdd() {
    if (!size) {
      setSizeError(true);
      return;
    }
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        colorKey: color.key,
        colorName: color.name,
        size,
        price: product.price,
        image: color.image,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="mt-8 grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
      {/* Ảnh */}
      <div className="grid gap-4 md:grid-cols-[88px_1fr]">
        <div className="order-2 flex gap-3 md:order-1 md:flex-col">
          {product.colors.map((c) => (
            <button
              key={c.key}
              onClick={() => setColorKey(c.key)}
              className={`relative aspect-[4/5] w-20 bg-sand transition md:w-full ${c.key === colorKey ? "ring-1 ring-noir" : "opacity-70 hover:opacity-100"}`}
              aria-label={`Xem màu ${c.name}`}
            >
              <Image src={c.image} alt="" fill unoptimized className="object-contain p-2" />
            </button>
          ))}
        </div>
        <div className="relative order-1 aspect-[4/5] bg-sand md:order-2">
          <Image src={color.image} alt={`${product.name} — ${color.name}`} fill unoptimized priority className="object-contain p-12" />
        </div>
      </div>

      {/* Thông tin & mua */}
      <div className="lg:sticky lg:top-36 lg:self-start">
        <p className="eyebrow text-gold-deep">{product.categoryName}</p>
        <h1 className="mt-3 font-serif text-[44px] leading-[1.1] font-medium">{product.name}</h1>
        <p className="mt-4 font-serif text-2xl">
          {formatPrice(product.price)}
          {product.compareAtPrice && (
            <span className="ml-3 text-lg text-stone line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </p>
        <p className="mt-6 text-stone">{product.description}</p>

        <div className="mt-10 border-t border-line pt-8">
          <p className="text-sm">
            Màu sắc: <span className="font-medium">{color.name}</span>
          </p>
          <div className="mt-3 flex gap-3">
            {product.colors.map((c) => (
              <button
                key={c.key}
                onClick={() => setColorKey(c.key)}
                className={`size-9 rounded-full border border-noir/15 ring-offset-2 ring-offset-ivory transition ${c.key === colorKey ? "ring-1 ring-noir" : ""}`}
                style={{ background: c.hex }}
                aria-label={c.name}
                aria-pressed={c.key === colorKey}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm">
            <p>Kích cỡ</p>
            {sizeError && <p className="text-danger">Vui lòng chọn kích cỡ</p>}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                }}
                className={`h-12 border text-sm transition ${s === size ? "border-noir bg-noir text-ivory" : sizeError ? "border-danger" : "border-line hover:border-noir"}`}
                aria-pressed={s === size}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <div className="flex h-12 items-center border border-line">
            <button className="grid h-full w-11 place-items-center" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng">
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button className="grid h-full w-11 place-items-center" onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))} aria-label="Tăng số lượng">
              <Plus size={14} />
            </button>
          </div>
          <button onClick={handleAdd} className="btn btn-primary flex-1">
            {added ? (
              <>
                <Check size={16} /> Đã thêm vào giỏ
              </>
            ) : (
              "Thêm vào giỏ"
            )}
          </button>
        </div>
        <Link href={`/try-on?product=${product.slug}&color=${color.key}`} className="btn btn-gold mt-3 w-full">
          <Camera size={16} strokeWidth={1.6} /> Thử ngay bằng camera
        </Link>

        <dl className="mt-10 divide-y divide-line border-y border-line text-sm">
          <div className="py-5">
            <dt className="eyebrow">Chất liệu</dt>
            <dd className="mt-2 text-stone">{product.material}</dd>
          </div>
          <div className="py-5">
            <dt className="eyebrow">Giao hàng & đổi trả</dt>
            <dd className="mt-2 text-stone">
              Miễn phí giao hàng cho đơn từ {formatPrice(SHIPPING.freeFrom)}. Đổi size hoặc trả hàng miễn phí trong 30 ngày.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
