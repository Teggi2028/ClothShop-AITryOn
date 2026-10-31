"use server";

// Server Action: hàm chạy trên SERVER nhưng được gọi từ form phía trình duyệt.
// Nguyên tắc an toàn: KHÔNG tin dữ liệu từ trình duyệt (giá tiền, tên sản phẩm...) —
// chỉ nhận id + số lượng, còn giá thì đọc lại từ database.

import { randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { shippingFeeFor } from "@/lib/format";
import { checkVoucher } from "@/lib/vouchers";

const PHONE_VN = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Vui lòng nhập họ tên").max(80, "Họ tên quá dài"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .pipe(z.string().regex(PHONE_VN, "Số điện thoại chưa đúng (ví dụ: 0912 345 678)")),
  email: z.union([z.literal(""), z.email("Email chưa đúng định dạng")]),
  address: z.string().trim().min(10, "Vui lòng nhập địa chỉ đầy đủ (số nhà, đường, phường/xã, tỉnh/thành)").max(300),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự"),
  voucherCode: z.string().trim().max(30),
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        colorKey: z.string(),
        size: z.string(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "Giỏ hàng đang trống")
    .max(50),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutField = Exclude<keyof CheckoutInput, "items">;
export type CheckoutResult =
  | { ok: true; code: string }
  | { ok: false; fieldErrors?: Partial<Record<CheckoutField, string[]>>; message?: string };

// Mã đơn dễ đọc: bỏ các ký tự dễ nhầm (0/O, 1/I)
function generateOrderCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[randomInt(alphabet.length)];
  return `AURA-${code}`;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { ok: false, fieldErrors, message: fieldErrors.items?.[0] };
  }
  const data = parsed.data;

  const products = await db.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
    include: { colors: true },
  });

  const lines = [];
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    const color = product?.colors.find((c) => c.key === item.colorKey);
    if (!product || !color || !product.sizes.split(",").includes(item.size)) {
      return { ok: false, message: "Một số sản phẩm trong giỏ không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng." };
    }
    lines.push({
      productId: product.id,
      productName: product.name,
      colorName: color.name,
      size: item.size,
      unitPrice: product.price,
      quantity: item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shippingFee = shippingFeeFor(subtotal);

  // Mã giảm giá: kiểm tra lại ở server theo tạm tính thật
  let discount = 0;
  if (data.voucherCode) {
    const voucher = checkVoucher(data.voucherCode, subtotal);
    if (!voucher.ok) return { ok: false, fieldErrors: { voucherCode: [voucher.message] } };
    discount = voucher.voucher.amount;
  }

  const order = await db.order.create({
    data: {
      code: generateOrderCode(),
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      note: data.note || null,
      subtotal,
      voucherCode: discount > 0 ? data.voucherCode.toUpperCase() : null,
      discount,
      shippingFee,
      total: subtotal - discount + shippingFee,
      items: { create: lines },
    },
  });

  return { ok: true, code: order.code };
}
