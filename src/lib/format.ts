import { SHIPPING } from "./brand";

const vnd = new Intl.NumberFormat("vi-VN");

/** 1890000 → "1.890.000₫" */
export function formatPrice(value: number) {
  return `${vnd.format(value)}₫`;
}

export function shippingFeeFor(subtotal: number) {
  return subtotal === 0 || subtotal >= SHIPPING.freeFrom ? 0 : SHIPPING.fee;
}

/** Phần trăm giảm giá, làm tròn: 440.000 / 550.000 → 20 */
export function discountPercent(price: number, compareAtPrice: number | null | undefined) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}

/** Mã sản phẩm hiển thị, vd: id 7 → "AU0007" */
export function productSku(id: number) {
  return `AU${String(id).padStart(4, "0")}`;
}
