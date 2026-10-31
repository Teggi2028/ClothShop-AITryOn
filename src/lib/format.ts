import { SHIPPING } from "./brand";

const vnd = new Intl.NumberFormat("vi-VN");

/** 1890000 → "1.890.000 ₫" */
export function formatPrice(value: number) {
  return `${vnd.format(value)} ₫`;
}

export function shippingFeeFor(subtotal: number) {
  return subtotal === 0 || subtotal >= SHIPPING.freeFrom ? 0 : SHIPPING.fee;
}
