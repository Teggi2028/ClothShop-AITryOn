import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductCard } from "@/components/ProductCard";
import { productSku } from "@/lib/format";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductPurchase } from "./ProductPurchase";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return { title: product?.name ?? "Không tìm thấy sản phẩm", description: product?.description };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.id, product.categoryId);

  return (
    <div className="container-shop">
      <Breadcrumb
        items={[
          { label: product.category.name, href: `/shop?category=${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <ProductPurchase
        product={{
          id: product.id,
          sku: productSku(product.id),
          slug: product.slug,
          name: product.name,
          description: product.description,
          material: product.material,
          sleeve: product.sleeve,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          isNew: product.isNew,
          sizes: product.sizes.split(","),
          colors: product.colors.map((c) => ({ key: c.key, name: c.name, hex: c.hex, image: c.image })),
          source: product.source,
        }}
      />

      <section className="mt-16">
        <h2 className="section-title uppercase">Sản phẩm liên quan</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
