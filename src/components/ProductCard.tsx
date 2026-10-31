import { Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductWithColors } from "@/lib/products";

export function ProductCard({ product }: { product: ProductWithColors }) {
  const [first, second] = product.colors;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Image
          src={first.image}
          alt={`${product.name} — màu ${first.name}`}
          fill
          unoptimized
          className={`object-contain p-8 transition duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.03] ${second ? "group-hover:opacity-0" : ""}`}
        />
        {second && (
          <Image
            src={second.image}
            alt=""
            fill
            unoptimized
            className="object-contain p-8 opacity-0 transition duration-700 ease-[var(--ease-lux)] group-hover:scale-[1.03] group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          {product.isNew ? <span className="eyebrow border border-line bg-pearl px-2 py-1 text-[10px]">Mới</span> : <span />}
          <span className="grid size-8 place-items-center rounded-full bg-pearl/90 text-gold-deep" title="Có thể thử bằng camera">
            <Camera size={15} strokeWidth={1.5} />
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-[13px] leading-5 font-normal">{product.name}</h3>
        <p className="font-serif text-lg">
          {formatPrice(product.price)}
          {product.compareAtPrice && (
            <span className="ml-2 text-sm text-stone line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </p>
        <div className="flex gap-1.5 pt-1">
          {product.colors.map((c) => (
            <span key={c.id} className="size-3 rounded-full border border-noir/15" style={{ background: c.hex }} title={c.name} />
          ))}
        </div>
      </div>
    </Link>
  );
}
