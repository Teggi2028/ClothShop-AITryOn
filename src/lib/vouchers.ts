// Mã giảm giá. Dùng chung cho cả giao diện (hiển thị, kiểm tra nhanh) lẫn server (tính tiền thật).
import { formatPrice } from "./format";

export type Voucher = { code: string; amount: number; minOrder: number };

export const VOUCHERS: Voucher[] = [
  { code: "AURA30K", amount: 30_000, minOrder: 599_000 },
  { code: "AURA50K", amount: 50_000, minOrder: 799_000 },
  { code: "AURA100K", amount: 100_000, minOrder: 1_290_000 },
  { code: "AURA200K", amount: 200_000, minOrder: 2_000_000 },
];

export type VoucherResult = { ok: true; voucher: Voucher } | { ok: false; message: string };

export function checkVoucher(rawCode: string, subtotal: number): VoucherResult {
  const code = rawCode.trim().toUpperCase();
  const voucher = VOUCHERS.find((v) => v.code === code);
  if (!voucher) return { ok: false, message: "Mã giảm giá không tồn tại" };
  if (subtotal < voucher.minOrder) {
    return { ok: false, message: `Mã ${code} áp dụng cho đơn từ ${formatPrice(voucher.minOrder)}` };
  }
  return { ok: true, voucher };
}
