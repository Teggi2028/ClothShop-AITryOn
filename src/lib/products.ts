import type { Prisma } from "@prisma/client";
import { cacheTag } from "next/cache";
import { COLOR_FAMILIES } from "@/data/catalog";
import { db } from "./db";

// Các hàm đọc sản phẩm từ database — chỉ gọi được ở phía server (Server Component, Server Action).
// "use cache": Next.js ghi nhớ kết quả, không phải hỏi database mỗi lần có người vào trang.
// Khi sản phẩm thay đổi (vd: trang admin sửa giá), gọi revalidateTag("products") để làm mới.

const withColors = {
  colors: { orderBy: { position: "asc" } },
  category: true,
} satisfies Prisma.ProductInclude;

export type ProductWithColors = Prisma.ProductGetPayload<{ include: typeof withColors }>;

export const SORT_OPTIONS = {
  newest: { label: "Mới nhất", orderBy: { createdAt: "desc" } },
  "price-asc": { label: "Giá: thấp → cao", orderBy: { price: "asc" } },
  "price-desc": { label: "Giá: cao → thấp", orderBy: { price: "desc" } },
  "name-asc": { label: "Tên A → Z", orderBy: { name: "asc" } },
} satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput }>;

export type SortKey = keyof typeof SORT_OPTIONS;

export const PRICE_RANGES = {
  "duoi-300k": { label: "Dưới 300.000₫", min: 0, max: 299_999 },
  "300k-500k": { label: "300.000₫ – 500.000₫", min: 300_000, max: 500_000 },
  "500k-1tr": { label: "500.000₫ – 1.000.000₫", min: 500_001, max: 1_000_000 },
  "tren-1tr": { label: "Trên 1.000.000₫", min: 1_000_001, max: Number.MAX_SAFE_INTEGER },
} as const;

export type PriceRangeKey = keyof typeof PRICE_RANGES;

export type ProductFilters = {
  category?: string;
  colors?: string[];
  price?: PriceRangeKey;
  q?: string;
  sort?: SortKey;
};

/** Bỏ dấu tiếng Việt để tìm kiếm: "Áo Sơ Mi" → "ao so mi" */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export async function getCategories() {
  "use cache";
  cacheTag("products");
  return db.category.findMany({ orderBy: { order: "asc" } });
}

/** Các họ màu đang có hàng (Đen, Trắng, Xanh than…) — dùng cho bộ lọc màu */
export async function getColorOptions() {
  "use cache";
  cacheTag("products");
  const used = await db.productColor.findMany({ select: { family: true }, distinct: ["family"] });
  const families = new Set(used.map((c) => c.family));
  return Object.entries(COLOR_FAMILIES)
    .filter(([key]) => families.has(key))
    .map(([key, f]) => ({ key, name: f.name, hex: f.hex }));
}

export async function getProducts(filters: ProductFilters = {}) {
  "use cache";
  cacheTag("products");
  const sort = SORT_OPTIONS[filters.sort ?? "newest"];
  const price = filters.price ? PRICE_RANGES[filters.price] : undefined;

  const products = await db.product.findMany({
    where: {
      category: filters.category ? { slug: filters.category } : undefined,
      colors: filters.colors?.length ? { some: { family: { in: filters.colors } } } : undefined,
      price: price ? { gte: price.min, lte: price.max } : undefined,
    },
    include: withColors,
    orderBy: [sort.orderBy, { id: "desc" }],
  });

  // Tìm theo tên (không phân biệt hoa thường, có dấu hay không dấu)
  if (filters.q) {
    const words = normalize(filters.q).split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const name = normalize(`${p.name} ${p.category.name}`);
      return words.every((w) => name.includes(w));
    });
  }
  return products;
}

export async function getFeaturedProducts() {
  "use cache";
  cacheTag("products");
  return db.product.findMany({ where: { featured: true }, include: withColors, orderBy: { id: "desc" }, take: 8 });
}

export async function getNewArrivals() {
  "use cache";
  cacheTag("products");
  return db.product.findMany({ where: { isNew: true }, include: withColors, orderBy: { id: "desc" }, take: 8 });
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag("products");
  return db.product.findUnique({ where: { slug }, include: withColors });
}

export async function getRelatedProducts(productId: number, categoryId: number, take = 4) {
  "use cache";
  cacheTag("products");
  const others = await db.product.findMany({
    where: { id: { not: productId } },
    include: withColors,
    orderBy: [{ featured: "desc" }, { id: "asc" }],
  });
  // ưu tiên sản phẩm cùng danh mục lên trước
  const sameCategory = (p: ProductWithColors) => Number(p.categoryId === categoryId);
  return others.sort((a, b) => sameCategory(b) - sameCategory(a)).slice(0, take);
}
