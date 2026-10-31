"use client";

import { Ticket } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { VOUCHERS } from "@/lib/vouchers";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // trình duyệt chặn clipboard → vẫn báo để khách tự nhớ mã
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };
  return { copied, copy };
}

const short = (n: number) => `${n / 1000}K`;

/** Hàng thẻ voucher (trang chủ, trang cửa hàng) */
export function VoucherCards() {
  const { copied, copy } = useCopy();
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {VOUCHERS.map((v) => (
        <div key={v.code} className="flex overflow-hidden rounded-md shadow-[0_1px_6px_rgba(0,0,0,0.12)]">
          <div className="grid w-14 shrink-0 place-items-center bg-promo">
            <Ticket className="text-ink" size={22} />
          </div>
          <div className="flex-1 p-3 text-center">
            <p className="font-extrabold text-sale">
              NHẬP MÃ: <br className="sm:hidden" />
              {v.code}
            </p>
            <p className="mt-1 text-xs text-muted">
              Giảm {short(v.amount)} cho đơn từ {formatPrice(v.minOrder)}
            </p>
            <button onClick={() => copy(v.code)} className="mt-2 rounded-sm bg-sale px-3 py-1 text-xs font-bold text-white hover:opacity-90">
              {copied === v.code ? "Đã chép ✓" : "Sao chép"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Ô khuyến mãi viền đỏ đứt nét (trang chi tiết sản phẩm) */
export function PromoBox() {
  const { copied, copy } = useCopy();
  return (
    <div className="relative mt-6 rounded-md border border-dashed border-sale px-4 pt-5 pb-4">
      <p className="absolute -top-3 left-3 bg-white px-2 text-[13px] font-extrabold text-sale uppercase">🎁 Khuyến mãi – ưu đãi</p>
      <ul className="space-y-1.5 text-[13px]">
        {VOUCHERS.slice(0, 2).map((v) => (
          <li key={v.code}>
            ✅ Nhập mã <b>{v.code}</b> giảm {short(v.amount)} cho đơn từ {short(v.minOrder)}{" "}
            <button onClick={() => copy(v.code)} className="text-sale hover:underline">
              {copied === v.code ? "Đã chép" : "Sao chép"}
            </button>
          </li>
        ))}
        <li>✅ Nhận hàng, kiểm tra ưng ý mới thanh toán</li>
        <li>✅ Đổi hàng trong vòng 30 ngày</li>
        <li>✅ Thử áo bằng camera trước khi mua</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {VOUCHERS.map((v) => (
          <button
            key={v.code}
            onClick={() => copy(v.code)}
            className="rounded-sm border border-sale px-2 py-0.5 text-xs font-semibold text-sale hover:bg-sale-soft"
          >
            {copied === v.code ? "Đã chép ✓" : v.code}
          </button>
        ))}
      </div>
    </div>
  );
}
