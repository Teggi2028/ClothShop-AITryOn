import type { Metadata } from "next";
import { TryOnStudio } from "@/features/try-on/TryOnStudio";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Phòng thử trực tuyến" };

export default async function TryOnPage({ searchParams }: PageProps<"/try-on">) {
  const params = await searchParams;
  const products = await getProducts();

  return (
    <TryOnStudio
      products={products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        sizes: p.sizes.split(","),
        fitWidth: p.fitWidth,
        fitOffsetY: p.fitOffsetY,
        colors: p.colors.map((c) => ({
          key: c.key,
          name: c.name,
          hex: c.hex,
          image: c.image,
          torsoAsset: c.torsoAsset,
          sleeveUpperAsset: c.sleeveUpperAsset,
          sleeveLowerAsset: c.sleeveLowerAsset,
        })),
      }))}
      initialSlug={typeof params.product === "string" ? params.product : undefined}
      initialColor={typeof params.color === "string" ? params.color : undefined}
    />
  );
}
