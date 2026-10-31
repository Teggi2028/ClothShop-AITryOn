import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Logo } from "./Logo";

const POLICIES = ["Chính sách đổi trả 30 ngày", "Chính sách giao hàng", "Hướng dẫn chọn size", "Chính sách bảo mật"];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-shop grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="items-start" />
          <p className="mt-4 text-muted">{BRAND.tagline}</p>
        </div>
        <div>
          <h3 className="font-bold uppercase">Mua sắm</h3>
          <ul className="mt-4 space-y-2.5 text-muted">
            <li><Link href="/shop" className="hover:text-ink">Tất cả sản phẩm</Link></li>
            <li><Link href="/shop?sort=newest" className="hover:text-ink">Hàng mới về</Link></li>
            <li><Link href="/try-on" className="hover:text-ink">Phòng thử AI</Link></li>
            <li><Link href="/cart" className="hover:text-ink">Giỏ hàng</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold uppercase">Hỗ trợ khách hàng</h3>
          <ul className="mt-4 space-y-2.5 text-muted">
            {POLICIES.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold uppercase">Liên hệ</h3>
          <ul className="mt-4 space-y-2.5 text-muted">
            <li className="flex gap-2"><MapPin size={16} className="mt-1 shrink-0" />{BRAND.address}</li>
            <li className="flex gap-2"><Phone size={16} className="mt-1 shrink-0" />Hotline: {BRAND.hotline}</li>
            <li className="flex gap-2"><Mail size={16} className="mt-1 shrink-0" />{BRAND.email}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container-shop py-5 text-center text-xs text-subtle">
          © 2026 {BRAND.fullName} · Đồ án minh hoạ, không kinh doanh thật · Hình ảnh trong phòng thử chỉ được xử lý trên thiết bị của bạn.
        </p>
      </div>
    </footer>
  );
}
