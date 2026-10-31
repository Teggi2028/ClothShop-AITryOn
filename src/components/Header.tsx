import { Camera, Search } from "lucide-react";
import Link from "next/link";
import { CartLink } from "./CartLink";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/shop?sort=newest", label: "Hàng mới về" },
  { href: "/shop?category=so-mi", label: "Sơ mi" },
  { href: "/shop?category=polo", label: "Polo" },
  { href: "/shop?category=thun", label: "Áo thun" },
  { href: "/shop?category=ao-ni", label: "Áo nỉ" },
  { href: "/shop?category=ao-khoac", label: "Áo khoác" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_var(--color-line)]">
      <div className="bg-topbar px-4 py-2 text-center text-[13px] font-semibold text-white uppercase">
        Miễn phí giao hàng cho đơn từ 500K · Nhập mã AURA30K giảm 30K · Thử đồ bằng AI ngay trên web
      </div>
      <div className="container-shop flex h-[68px] items-center gap-8">
        <Logo className="shrink-0" />
        <nav className="hidden flex-1 items-center gap-6 text-[15px] lg:flex" aria-label="Danh mục">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-accent">
              {item.label}
            </Link>
          ))}
          <Link href="/try-on" className="flex items-center gap-1.5 font-bold whitespace-nowrap text-accent hover:underline">
            <Camera size={17} /> Phòng thử
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-5">
          {/* Tìm kiếm: form GET bình thường → chuyển tới /shop?q=... (không cần JavaScript) */}
          <form action="/shop" className="relative hidden md:block" role="search">
            <input name="q" type="search" placeholder="Tìm sản phẩm..." className="input h-10 w-56 rounded-full pr-10 text-sm" aria-label="Tìm sản phẩm" />
            <button type="submit" className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink" aria-label="Tìm">
              <Search size={18} />
            </button>
          </form>
          <Link href="/try-on" className="text-accent lg:hidden" aria-label="Phòng thử">
            <Camera size={22} />
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
