// Đổ dữ liệu mẫu vào database. Chạy: npm run db:seed
// Cảnh báo: script XOÁ toàn bộ sản phẩm cũ (đơn hàng được giữ nguyên) rồi tạo lại từ src/data/catalog.ts.

import { PrismaClient } from "@prisma/client";
import { CATEGORIES, COLORS, PRODUCTS, SIZES, garmentPaths } from "../src/data/catalog";

const prisma = new PrismaClient();

async function main() {
  await prisma.productColor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categoryIds: Record<string, number> = {};
  for (const [order, c] of CATEGORIES.entries()) {
    const created = await prisma.category.create({ data: { slug: c.slug, name: c.name, order } });
    categoryIds[c.slug] = created.id;
  }

  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        material: p.material,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        sizes: SIZES.join(","),
        isNew: p.isNew ?? false,
        featured: p.featured ?? false,
        garmentStyle: p.style,
        sleeve: p.sleeve,
        fitWidth: p.fitWidth ?? 1,
        categoryId: categoryIds[p.category],
        colors: {
          create: p.colors.map((key, position) => ({
            key,
            name: COLORS[key].name,
            hex: COLORS[key].hex,
            position,
            ...garmentPaths(p.slug, key, p.sleeve),
          })),
        },
      },
    });
  }
  console.log(`Đã tạo ${CATEGORIES.length} danh mục, ${PRODUCTS.length} sản phẩm.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
