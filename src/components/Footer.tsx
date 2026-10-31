import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-32 bg-noir text-ivory">
      <div className="container-lux grid gap-12 py-20 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="items-start" />
          <p className="mt-6 max-w-sm text-sm text-ivory/60">{BRAND.tagline} Phòng thử trực tuyến giúp bạn thấy mình trong từng thiết kế trước khi quyết định.</p>
        </div>
        <div>
          <p className="eyebrow text-gold">Mua sắm</p>
          <ul className="mt-5 space-y-3 text-sm text-ivory/70">
            <li><Link href="/shop" className="hover:text-ivory">Tất cả sản phẩm</Link></li>
            <li><Link href="/try-on" className="hover:text-ivory">Phòng thử trực tuyến</Link></li>
            <li><Link href="/cart" className="hover:text-ivory">Giỏ hàng</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-gold">Liên hệ</p>
          <ul className="mt-5 space-y-3 text-sm text-ivory/70">
            <li>{BRAND.address}</li>
            <li>Hotline: {BRAND.hotline}</li>
            <li>{BRAND.email}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-lux flex flex-col justify-between gap-2 py-6 text-xs text-ivory/40 sm:flex-row">
          <p>© 2026 {BRAND.fullName}. Đồ án minh hoạ — không kinh doanh thật.</p>
          <p>Hình ảnh trong phòng thử chỉ được xử lý trên thiết bị của bạn.</p>
        </div>
      </div>
    </footer>
  );
}
