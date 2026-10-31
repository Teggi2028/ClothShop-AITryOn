import type { Metadata } from "next";
import { TryOnStudio } from "@/features/try-on/TryOnStudio";
import { getCategories, getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Phòng thử trực tuyến" };

export default async function TryOnPage({ searchParams }: PageProps<"/try-on">) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <TryOnStudio
      products={products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category.slug,
        price: p.price,
        sizes: p.sizes.split(","),
        colors: p.colors.map((c) => ({
          key: c.key,
          name: c.name,
          hex: c.hex,
          image: c.image,
        })),
      }))}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      initialSlug={typeof params.product === "string" ? params.product : undefined}
      initialColor={typeof params.color === "string" ? params.color : undefined}
    />
  );
}
