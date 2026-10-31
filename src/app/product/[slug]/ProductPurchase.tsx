"use client";

import { Camera, Check, Minus, Plus, Ruler } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PromoBox } from "@/components/VoucherList";
import { BRAND } from "@/lib/brand";
import { discountPercent, formatPrice } from "@/lib/format";
import { MAX_QUANTITY, useCart } from "@/stores/cart";

export type PurchaseProduct = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  description: string;
  material: string;
  sleeve: string;
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  sizes: string[];
  colors: { key: string; name: string; hex: string; image: string }[];
  source: string | null;
};

export function ProductPurchase({ product }: { product: PurchaseProduct }) {
  const [colorKey, setColorKey] = useState(product.colors[0].key);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const add = useCart((s) => s.add);

  const color = product.colors.find((c) => c.key === colorKey) ?? product.colors[0];
  const off = discountPercent(product.price, product.compareAtPrice);

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
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
      {/* ===== Ảnh ===== */}
      <div>
        <div className="relative aspect-[37/48] overflow-hidden bg-surface">
          <Image src={color.image} alt={`${product.name} — ${color.name}`} fill unoptimized priority className="object-cover" />
        </div>
        {product.source && (
          <p className="mt-2 text-xs text-subtle">
            Ảnh &amp; thông tin sản phẩm:{" "}
            <a href={product.source} target="_blank" rel="noreferrer" className="underline hover:text-accent">
              savani.vn
            </a>{" "}
            (dùng cho đồ án)
          </p>
        )}
      </div>

      {/* ===== Thông tin ===== */}
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-1 text-[13px] text-muted">
          Thương hiệu: <span className="text-accent">{BRAND.name}</span>
          <span className="mx-2 text-line">|</span>
          Mã sản phẩm: <span className="text-accent">{product.sku}</span>
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-2xl font-extrabold text-sale">{formatPrice(product.price)}</span>
          {off > 0 && (
            <>
              <span className="text-muted line-through">{formatPrice(product.compareAtPrice!)}</span>
              <span className="badge-sale">-{off}%</span>
            </>
          )}
        </div>
        {off > 0 && <p className="text-[13px] text-muted">(Tiết kiệm: <span className="text-sale">{formatPrice(product.compareAtPrice! - product.price)}</span>)</p>}
        {product.isNew && <span className="badge-new mt-3">🔥 Hàng mới về</span>}

        <PromoBox />

        <div className="mt-6">
          <p className="text-sm font-bold">
            Màu sắc: <span className="font-normal uppercase">{color.name}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c.key}
                onClick={() => setColorKey(c.key)}
                className={`relative size-11 overflow-hidden rounded-full border-2 bg-surface ${c.key === color.key ? "border-ink" : "border-transparent"}`}
                title={c.name}
                aria-label={c.name}
                aria-pressed={c.key === color.key}
              >
                <Image src={c.image} alt="" fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <p className="font-bold">
              Kích thước: <span className="font-normal">{size ?? ""}</span>
              {sizeError && <span className="ml-2 font-normal text-sale">Vui lòng chọn kích thước</span>}
            </p>
            <span className="flex items-center gap-1 text-muted underline">
              <Ruler size={14} /> Hướng dẫn chọn size
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                }}
                className={`h-9 min-w-12 rounded border px-3 text-sm ${s === size ? "border-ink bg-ink text-white" : sizeError ? "border-sale" : "border-line hover:border-ink"}`}
                aria-pressed={s === size}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-bold">Kiểu tay áo:</dt>
            <dd>{product.sleeve === "long" ? "Tay dài" : product.sleeve === "short" ? "Tay ngắn" : "Không tay"}</dd>
          </div>
          <div>
            <dt className="font-bold">Chất liệu:</dt>
            <dd>{product.material}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <div className="flex h-11 items-center rounded border border-line">
            <button className="grid h-full w-10 place-items-center" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng">
              <Minus size={14} />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button className="grid h-full w-10 place-items-center" onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))} aria-label="Tăng số lượng">
              <Plus size={14} />
            </button>
          </div>
          <button onClick={handleAdd} className="btn btn-primary flex-1 uppercase">
            {added ? (
              <>
                <Check size={16} /> Đã thêm vào giỏ
              </>
            ) : (
              "Thêm vào giỏ"
            )}
          </button>
        </div>
        <Link href={`/try-on?product=${product.slug}&color=${color.key}`} className="btn btn-accent mt-3 w-full uppercase">
          <Camera size={18} /> Thử ngay bằng AI
        </Link>

        <div className="mt-8 border-t border-line pt-6">
          <h2 className="font-bold uppercase">Mô tả sản phẩm</h2>
          <p className="mt-2 text-muted">{product.description}</p>
        </div>
      </div>
    </div>
  );
}
