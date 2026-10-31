import { Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { VoucherCards } from "@/components/VoucherList";
import {
  PRICE_RANGES,
  SORT_OPTIONS,
  type PriceRangeKey,
  type SortKey,
  getCategories,
  getColorOptions,
  getProducts,
} from "@/lib/products";
import { SortSelect } from "./SortSelect";

export const metadata: Metadata = { title: "Áo nam" };

type Query = { category?: string; color?: string; price?: string; sort?: string; q?: string; page?: string };

const PAGE_SIZE = 24;

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const raw = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);
  const query: Query = {
    category: one(raw.category),
    color: one(raw.color),
    price: one(raw.price),
    sort: one(raw.sort),
    q: one(raw.q),
    page: one(raw.page),
  };

  const sort = (query.sort && query.sort in SORT_OPTIONS ? query.sort : "newest") as SortKey;
  const price = query.price && query.price in PRICE_RANGES ? (query.price as PriceRangeKey) : undefined;
  const colors = query.color?.split(",").filter(Boolean) ?? [];

  const [categories, colorOptions, products] = await Promise.all([
    getCategories(),
    getColorOptions(),
    getProducts({ category: query.category, colors, price, q: query.q, sort }),
  ]);
  const current = categories.find((c) => c.slug === query.category);
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(query.page) || 1), pageCount);
  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Tạo link giữ nguyên các bộ lọc khác, chỉ đổi những gì truyền vào (undefined = bỏ lọc).
  // Đổi bộ lọc thì quay về trang 1 (patch không có "page" → bỏ page).
  const href = (patch: Partial<Query>) => {
    const next = { ...query, page: undefined, ...patch };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && !(k === "sort" && v === "newest") && !(k === "page" && v === "1")) qs.set(k, v);
    const s = qs.toString();
    return s ? `/shop?${s}` : "/shop";
  };
  const toggleColor = (key: string) => {
    const set = new Set(colors);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    return href({ color: [...set].join(",") || undefined });
  };
  const hasFilter = Boolean(query.category || colors.length || price || query.q);

  const title = query.q ? `Kết quả cho “${query.q}”` : (current?.name ?? "Áo nam");

  return (
    <div className="container-shop">
      <Breadcrumb items={current ? [{ label: "Áo nam", href: "/shop" }, { label: current.name }] : [{ label: "Áo nam" }]} />

      <div className="mt-6">
        <VoucherCards />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h1 className="section-title">{title}</h1>
        <SortSelect
          value={sort}
          options={Object.entries(SORT_OPTIONS).map(([value, o]) => ({ value, label: o.label, href: href({ sort: value }) }))}
        />
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* ===== Bộ lọc ===== */}
        <aside className="space-y-8 text-sm">
          {hasFilter && (
            <Link href={query.q ? `/shop?q=${encodeURIComponent(query.q)}` : "/shop"} className="flex items-center gap-1 text-sale hover:underline">
              <X size={14} /> Xoá bộ lọc
            </Link>
          )}

          <div>
            <h2 className="font-bold uppercase">Danh mục</h2>
            <ul className="mt-3 space-y-2">
              {categories.map((c) => {
                const active = c.slug === query.category;
                return (
                  <li key={c.id}>
                    <Link href={href({ category: active ? undefined : c.slug })} className="flex items-center gap-2 hover:text-accent">
                      <span className={`grid size-4 place-items-center rounded-sm border ${active ? "border-ink bg-ink text-white" : "border-subtle"}`}>
                        {active && <Check size={12} strokeWidth={3} />}
                      </span>
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="font-bold uppercase">Màu sắc</h2>
            <ul className="mt-3 space-y-2">
              {colorOptions.map((c) => {
                const active = colors.includes(c.key);
                return (
                  <li key={c.key}>
                    <Link href={toggleColor(c.key)} className={`flex items-center gap-2 hover:text-accent ${active ? "font-bold" : ""}`}>
                      <span className={`size-4 rounded-full border ${active ? "ring-2 ring-ink ring-offset-1" : "border-line"}`} style={{ background: c.hex }} />
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="font-bold uppercase">Khoảng giá</h2>
            <ul className="mt-3 space-y-2">
              {Object.entries(PRICE_RANGES).map(([key, r]) => {
                const active = key === price;
                return (
                  <li key={key}>
                    <Link href={href({ price: active ? undefined : key })} className="flex items-center gap-2 hover:text-accent">
                      <span className={`grid size-4 place-items-center rounded-full border ${active ? "border-ink" : "border-subtle"}`}>
                        {active && <span className="size-2 rounded-full bg-ink" />}
                      </span>
                      {r.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* ===== Lưới sản phẩm ===== */}
        <div>
          <p className="mb-4 text-sm text-muted">{products.length} sản phẩm</p>
          {products.length === 0 ? (
            <div className="rounded-md bg-surface py-20 text-center text-muted">
              Không tìm thấy sản phẩm phù hợp.{" "}
              <Link href="/shop" className="text-accent hover:underline">
                Xem tất cả
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav className="mt-12 flex flex-wrap justify-center gap-2" aria-label="Phân trang">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={href({ page: String(n) })}
                  className={`grid size-10 place-items-center rounded border text-sm ${n === page ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
