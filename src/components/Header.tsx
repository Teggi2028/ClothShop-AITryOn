import { Camera } from "lucide-react";
import Link from "next/link";
import { SHIPPING } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { CartLink } from "./CartLink";
import { Logo } from "./Logo";

const NAV = [
  { href: "/shop", label: "Tất cả" },
  { href: "/shop?category=so-mi", label: "Sơ mi" },
  { href: "/shop?category=ao-len", label: "Áo len" },
  { href: "/shop?category=blazer", label: "Blazer" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-noir py-2 text-center text-[11px] tracking-[0.18em] text-ivory/80 uppercase">
        Miễn phí giao hàng cho đơn từ {formatPrice(SHIPPING.freeFrom)}
        <span className="mx-3 text-gold">◆</span>
        Thử đồ trực tuyến bằng camera
      </div>
      <div className="border-b border-line bg-ivory/95 backdrop-blur">
        <div className="container-lux grid h-20 grid-cols-[1fr_auto_1fr] items-center">
          <nav className="flex gap-8 text-[12px] font-medium tracking-[0.16em] uppercase" aria-label="Danh mục">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hidden transition-colors hover:text-gold-deep md:block">
                {item.label}
              </Link>
            ))}
            <Link href="/shop" className="md:hidden">
              Cửa hàng
            </Link>
          </nav>
          <Logo />
          <div className="flex items-center justify-end gap-8">
            <Link
              href="/try-on"
              className="hidden items-center gap-2 text-[12px] font-medium tracking-[0.16em] text-gold-deep uppercase transition-colors hover:text-noir sm:flex"
            >
              <Camera size={18} strokeWidth={1.4} />
              Phòng thử
            </Link>
            <CartLink />
          </div>
        </div>
      </div>
    </header>
  );
}
