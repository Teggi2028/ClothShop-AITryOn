import type { Prisma } from "@prisma/client";
import { cacheTag } from "next/cache";
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
  "price-asc": { label: "Giá tăng dần", orderBy: { price: "asc" } },
  "price-desc": { label: "Giá giảm dần", orderBy: { price: "desc" } },
} satisfies Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput }>;

export type SortKey = keyof typeof SORT_OPTIONS;

export async function getCategories() {
  "use cache";
  cacheTag("products");
  return db.category.findMany({ orderBy: { order: "asc" } });
}

export async function getProducts(options: { category?: string; sort?: SortKey } = {}) {
  "use cache";
  cacheTag("products");
  const sort = SORT_OPTIONS[options.sort ?? "newest"];
  return db.product.findMany({
    where: options.category ? { category: { slug: options.category } } : undefined,
    include: withColors,
    orderBy: [sort.orderBy, { id: "asc" }],
  });
}

export async function getFeaturedProducts() {
  "use cache";
  cacheTag("products");
  return db.product.findMany({ where: { featured: true }, include: withColors, take: 4 });
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
