import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
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
    <div className="container-lux pt-10">
      <nav className="text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-noir">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-noir">{product.category.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-noir">{product.name}</span>
      </nav>

      <ProductPurchase
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          categoryName: product.category.name,
          description: product.description,
          material: product.material,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          sizes: product.sizes.split(","),
          colors: product.colors.map((c) => ({ key: c.key, name: c.name, hex: c.hex, image: c.image })),
        }}
      />

      <section className="pt-32">
        <h2 className="font-serif text-3xl font-medium">Có thể bạn cũng thích</h2>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
