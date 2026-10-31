import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { SORT_OPTIONS, getCategories, getProducts, type SortKey } from "@/lib/products";

export const metadata: Metadata = { title: "Cửa hàng" };

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const sort = (typeof params.sort === "string" && params.sort in SORT_OPTIONS ? params.sort : "newest") as SortKey;

  const [categories, products] = await Promise.all([getCategories(), getProducts({ category, sort })]);
  const current = categories.find((c) => c.slug === category);

  // Tạo link giữ nguyên bộ lọc hiện tại, chỉ đổi 1 tham số
  const href = (next: { category?: string | null; sort?: string }) => {
    const q = new URLSearchParams();
    const cat = next.category === null ? undefined : (next.category ?? category);
    if (cat) q.set("category", cat);
    const s = next.sort ?? sort;
    if (s !== "newest") q.set("sort", s);
    const qs = q.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const chip = (active: boolean) =>
    `eyebrow border px-4 py-2.5 transition-colors ${active ? "border-noir bg-noir text-ivory" : "border-line hover:border-noir"}`;

  return (
    <div className="container-lux pt-16">
      <header className="text-center">
        <p className="eyebrow text-gold-deep">Cửa hàng</p>
        <h1 className="mt-3 font-serif text-5xl font-medium">{current?.name ?? "Tất cả thiết kế"}</h1>
      </header>

      <div className="mt-12 flex flex-col gap-6 border-y border-line py-5 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-2" aria-label="Lọc theo danh mục">
          <Link href={href({ category: null })} className={chip(!category)}>
            Tất cả
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={href({ category: c.slug })} className={chip(c.slug === category)}>
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-5 text-sm">
          <span className="text-stone">{products.length} sản phẩm</span>
          <span className="h-4 w-px bg-line" />
          {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
            <Link key={key} href={href({ sort: key })} className={key === sort ? "font-medium text-noir underline underline-offset-4" : "text-stone hover:text-noir"}>
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="py-24 text-center text-stone">Chưa có sản phẩm trong danh mục này.</p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
