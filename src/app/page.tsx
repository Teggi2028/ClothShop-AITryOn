import { ArrowRight, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/products";

const STEPS = [
  { no: "01", title: "Chọn thiết kế", text: "Lựa mẫu áo và màu sắc bạn yêu thích ngay trong phòng thử." },
  { no: "02", title: "Bật camera", text: "Đứng hoặc ngồi thẳng trước laptop, áo sẽ tự khớp theo vai và dáng người." },
  { no: "03", title: "Chụp & quyết định", text: "Lưu lại khoảnh khắc, so sánh các phối màu rồi thêm vào giỏ." },
];

const VALUES = ["Chất liệu tuyển chọn", "May đo tỉ mỉ", "Đổi trả trong 30 ngày", "Thử trước khi mua"];

export default async function HomePage() {
  const [featured, categories, all] = await Promise.all([getFeaturedProducts(), getCategories(), getProducts()]);
  const hero = all.find((p) => p.slug === "blazer-wool-tailored") ?? all[0];
  const heroColor = hero.colors.find((c) => c.key === "navy") ?? hero.colors[0];

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="bg-noir text-ivory">
        <div className="container-lux grid min-h-[640px] items-center gap-16 py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow text-gold">Bộ sưu tập Thu Đông 2026</p>
            <h1 className="mt-6 font-serif text-5xl leading-[1.05] font-medium md:text-[68px]">
              Mặc thử trước.
              <br />
              <em className="text-gold">Chọn lựa tinh tế.</em>
            </h1>
            <p className="mt-8 max-w-md text-ivory/70">
              Phòng thử trực tuyến của AURA dùng camera trên laptop để bạn ngắm mình trong từng thiết kế, ngay tại nhà,
              trước khi quyết định.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/try-on" className="btn btn-gold">
                <Camera size={16} strokeWidth={1.6} /> Vào phòng thử
              </Link>
              <Link href="/shop" className="btn btn-outline text-ivory hover:!border-ivory hover:!bg-ivory hover:!text-noir">
                Khám phá bộ sưu tập
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-4 border border-gold/40" aria-hidden />
            <div className="relative aspect-[4/5] bg-gradient-to-b from-[#2a2724] to-[#1a1817]">
              <Image src={heroColor.image} alt={hero.name} fill unoptimized priority className="object-contain p-12" />
              {/* Gợi ý giao diện phòng thử */}
              <div className="absolute top-5 left-5 flex items-center gap-2 bg-noir/60 px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase backdrop-blur">
                <span className="size-1.5 animate-pulse rounded-full bg-gold" /> Đang thử trực tiếp
              </div>
            </div>
            <p className="mt-8 text-center font-serif text-lg text-ivory/80 italic">{hero.name}</p>
          </div>
        </div>
      </section>

      {/* ===== Giá trị ===== */}
      <section className="border-b border-line">
        <ul className="container-lux grid grid-cols-2 gap-y-4 py-6 text-center md:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v} className="eyebrow text-stone">
              {v}
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Sản phẩm nổi bật ===== */}
      <section className="container-lux pt-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-gold-deep">Tuyển chọn</p>
            <h2 className="mt-3 font-serif text-4xl font-medium">Những thiết kế được yêu thích</h2>
          </div>
          <Link href="/shop" className="link-underline hidden pb-1 text-sm sm:block">
            Xem tất cả
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ===== Phòng thử ===== */}
      <section className="container-lux pt-32">
        <div className="grid gap-16 bg-pearl p-10 md:p-16 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow text-gold-deep">Dịch vụ độc quyền</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight font-medium">Phòng thử riêng, ngay trên laptop của bạn</h2>
            <p className="mt-6 text-stone">
              Công nghệ nhận diện dáng người chạy trực tiếp trên trình duyệt. Hình ảnh của bạn không bao giờ rời khỏi
              thiết bị.
            </p>
            <Link href="/try-on" className="btn btn-primary mt-10">
              Thử ngay <ArrowRight size={16} strokeWidth={1.4} />
            </Link>
          </div>
          <ol className="grid gap-10 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.no} className="border-t border-line pt-6">
                <span className="font-serif text-5xl text-gold">{s.no}</span>
                <h3 className="mt-4 text-[13px] font-medium tracking-[0.12em] uppercase">{s.title}</h3>
                <p className="mt-3 text-sm text-stone">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Danh mục ===== */}
      <section className="container-lux pt-32">
        <h2 className="text-center font-serif text-4xl font-medium">Mua sắm theo danh mục</h2>
        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {categories.map((c) => {
            const sample = all.find((p) => p.categoryId === c.id);
            return (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-sand">
                {sample && (
                  <Image
                    src={sample.colors[0].image}
                    alt=""
                    fill
                    unoptimized
                    className="object-contain p-10 transition duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-noir/70 to-transparent p-6 pt-16 text-ivory">
                  <span className="font-serif text-2xl">{c.name}</span>
                  <ArrowRight size={18} strokeWidth={1.4} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
