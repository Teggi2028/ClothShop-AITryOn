import { Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { discountPercent, formatPrice } from "@/lib/format";
import type { ProductWithColors } from "@/lib/products";

export function ProductCard({ product }: { product: ProductWithColors }) {
  const first = product.colors[0];
  // Ảnh chính: màu đầu tiên; rê chuột: màu thứ 2 (nếu có)
  const hover = product.colors[1]?.image;
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <div className="group">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[37/48] overflow-hidden bg-surface">
        <Image
          src={first.image}
          alt={`${product.name} — ${first.name}`}
          fill
          unoptimized
          className={`object-cover transition duration-500 ${hover ? "group-hover:opacity-0" : ""}`}
        />
        {hover && (
          <Image src={hover} alt="" fill unoptimized className="object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.isNew && <span className="badge-new">🔥 Hàng mới về</span>}
          {product.featured && !product.isNew && <span className="badge-new bg-ink">Bán chạy</span>}
        </div>
        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-accent shadow-sm">
          <Camera size={13} /> Thử được
        </span>
      </Link>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] tracking-[0.2em] text-subtle uppercase">{BRAND.name}</p>
        <h3 className="line-clamp-2 min-h-[44px] text-[15px] leading-[22px]">
          <Link href={`/product/${product.slug}`} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <p className="font-bold text-sale">{formatPrice(product.price)}</p>
        <p className="flex h-5 items-center gap-2 text-[13px]">
          {off > 0 && (
            <>
              <span className="text-muted line-through">{formatPrice(product.compareAtPrice!)}</span>
              <span className="badge-sale">-{off}%</span>
            </>
          )}
        </p>
        <div className="flex gap-1.5 pt-1">
          {product.colors.slice(0, 6).map((c) => (
            <span key={c.id} className="size-5 rounded-full border border-line p-0.5" title={c.name}>
              <span className="block size-full rounded-full" style={{ background: c.hex }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
