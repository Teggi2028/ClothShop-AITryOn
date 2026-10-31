import { Camera, ChevronRight, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { VoucherCards } from "@/components/VoucherList";
import { getCategories, getFeaturedProducts, getNewArrivals, getProducts } from "@/lib/products";

const SERVICES = [
  { icon: Truck, title: "Miễn phí giao hàng", text: "Cho đơn từ 500.000₫" },
  { icon: RefreshCw, title: "Đổi trả 30 ngày", text: "Đổi size, đổi mẫu dễ dàng" },
  { icon: ShieldCheck, title: "Kiểm tra khi nhận", text: "Ưng ý mới thanh toán" },
  { icon: Camera, title: "Thử đồ bằng AI", text: "Xem áo trên người bạn" },
];

const STEPS = [
  { no: 1, title: "Chọn mẫu áo", text: "Vào phòng thử, chọn mẫu và màu bạn thích." },
  { no: 2, title: "Chụp ảnh", text: "Chụp bằng webcam hoặc tải ảnh lên, AI tạo ảnh bạn mặc áo." },
  { no: 3, title: "So sánh & đặt hàng", text: "Thử nhiều màu, lưu ảnh rồi thêm vào giỏ." },
];

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="section-title uppercase">{title}</h2>
      <Link href={href} className="flex items-center text-sm text-muted hover:text-accent">
        Xem tất cả <ChevronRight size={16} />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [newArrivals, featured, categories, all] = await Promise.all([
    getNewArrivals(),
    getFeaturedProducts(),
    getCategories(),
    getProducts(),
  ]);
  const heroPhotos = (newArrivals.length >= 3 ? newArrivals : all).slice(0, 3).map((p) => ({ src: p.colors[0].image, alt: p.name }));

  return (
    <div className="container-shop">
      {/* ===== Banner ===== */}
      <section className="mt-6 grid overflow-hidden rounded-lg bg-gradient-to-br from-[#14243b] via-[#1d3557] to-[#2b4f7e] text-white lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col justify-center p-10 lg:p-14">
          <p className="w-fit rounded-full bg-promo px-3 py-1 text-xs font-extrabold text-ink uppercase">Bộ sưu tập Thu Đông 2026</p>
          <h1 className="mt-5 text-4xl leading-tight font-extrabold uppercase lg:text-5xl">
            Hàng mới về
            <br />
            <span className="text-promo">Giảm đến 50%</span>
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Hơn {Math.floor(all.length / 10) * 10} mẫu áo nam. Không chắc có hợp? Chụp một tấm ảnh và để AI cho bạn xem trước khi đặt hàng.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn bg-white text-ink hover:bg-promo">
              Mua ngay
            </Link>
            <Link href="/try-on" className="btn btn-accent">
              <Camera size={18} /> Thử đồ bằng AI
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4 lg:p-6">
          {heroPhotos.map((p, i) => (
            <div key={p.src} className={`relative overflow-hidden rounded-md bg-white ${i === 1 ? "mt-8" : "mb-8"}`}>
              <Image src={p.src} alt={p.alt} fill unoptimized priority className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* ===== Dịch vụ ===== */}
      <section className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-line p-5 lg:grid-cols-4">
        {SERVICES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="shrink-0 text-accent" size={30} strokeWidth={1.5} />
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ===== Voucher ===== */}
      <section className="mt-10">
        <VoucherCards />
      </section>

      {/* ===== Danh mục ===== */}
      <section className="mt-14">
        <h2 className="section-title uppercase">Danh mục sản phẩm</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => {
            const sample = all.find((p) => p.categoryId === c.id);
            const color = sample?.colors[0];
            return (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group text-center">
                <div className="relative aspect-square overflow-hidden rounded-full bg-surface">
                  {color && (
                    <Image
                      src={color.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-3 font-bold group-hover:text-accent">{c.name}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== Hàng mới về ===== */}
      <section className="mt-14">
        <SectionHeader title="Hàng mới về" href="/shop?sort=newest" />
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ===== Phòng thử ===== */}
      <section className="mt-14 grid gap-8 rounded-lg bg-accent-soft p-8 lg:grid-cols-[1fr_1.6fr] lg:p-10">
        <div>
          <p className="font-extrabold text-accent uppercase">Tính năng mới</p>
          <h2 className="mt-2 text-3xl font-extrabold">Chụp một tấm, AI cho bạn mặc thử</h2>
          <p className="mt-3 text-muted">
            Chụp bằng webcam hoặc tải ảnh lên, AI tạo ảnh bạn đang mặc chiếc áo đã chọn chỉ sau khoảng nửa phút.
          </p>
          <Link href="/try-on" className="btn btn-accent mt-6">
            <Camera size={18} /> Vào phòng thử
          </Link>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.no} className="rounded-md bg-white p-5">
              <span className="grid size-9 place-items-center rounded-full bg-accent font-extrabold text-white">{s.no}</span>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-[13px] text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== Bán chạy ===== */}
      <section className="mt-14">
        <SectionHeader title="Sản phẩm bán chạy" href="/shop" />
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
