"use client";

import { Loader2, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { OrderSummary } from "@/components/OrderSummary";
import { formatPrice } from "@/lib/format";
import { checkVoucher } from "@/lib/vouchers";
import { cartSubtotal, useCart, useHydrated } from "@/stores/cart";
import { type CheckoutField, type CheckoutResult, placeOrder } from "./actions";

const FIELDS: { name: Exclude<CheckoutField, "voucherCode">; label: string; type?: string; autoComplete?: string; textarea?: boolean; optional?: boolean }[] = [
  { name: "customerName", label: "Họ và tên", autoComplete: "name" },
  { name: "phone", label: "Số điện thoại", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", optional: true },
  { name: "address", label: "Địa chỉ giao hàng", autoComplete: "street-address" },
  { name: "note", label: "Ghi chú cho đơn hàng", textarea: true, optional: true },
];

export function CheckoutForm() {
  const { items, clear } = useCart();
  const hydrated = useHydrated();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Extract<CheckoutResult, { ok: false }> | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  if (!hydrated) return <p className="py-24 text-center text-sm text-muted">Đang tải…</p>;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">Giỏ hàng đang trống nên chưa thể đặt hàng.</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Đến cửa hàng
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  // Kiểm tra lại mã mỗi lần vẽ: nếu khách giảm số lượng làm đơn không đủ điều kiện thì mã tự mất hiệu lực
  const voucher = appliedCode ? checkVoucher(appliedCode, subtotal) : null;
  const discount = voucher?.ok ? voucher.voucher.amount : 0;
  const voucherError = voucher && !voucher.ok ? voucher.message : result?.fieldErrors?.voucherCode?.[0];

  // Dùng onSubmit thay cho <form action>: React tự xoá trắng form sau action,
  // khiến khách mất dữ liệu đã nhập khi có lỗi.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await placeOrder({
        customerName: String(formData.get("customerName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        address: String(formData.get("address") ?? ""),
        note: String(formData.get("note") ?? ""),
        voucherCode: voucher?.ok ? voucher.voucher.code : "",
        items: items.map((i) => ({ productId: i.productId, colorKey: i.colorKey, size: i.size, quantity: i.quantity })),
      });
      if (res.ok) {
        router.push(`/order/${res.code}`);
        clear();
      } else {
        setResult(res);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
      <div className="rounded-md border border-line p-6">
        <h2 className="font-bold uppercase">Thông tin giao hàng</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const error = result?.fieldErrors?.[f.name]?.[0];
            const common = {
              id: f.name,
              name: f.name,
              autoComplete: f.autoComplete,
              "aria-invalid": error ? true : undefined,
              "aria-describedby": error ? `${f.name}-error` : undefined,
            };
            return (
              <div key={f.name} className={f.name === "address" || f.textarea ? "sm:col-span-2" : ""}>
                <label htmlFor={f.name} className="mb-1.5 block text-sm font-semibold">
                  {f.label}
                  {f.optional ? <span className="font-normal text-subtle"> (không bắt buộc)</span> : <span className="text-sale"> *</span>}
                </label>
                {f.textarea ? (
                  <textarea {...common} rows={3} className="input h-auto resize-none py-2.5" />
                ) : (
                  <input {...common} type={f.type ?? "text"} className="input" />
                )}
                {error && (
                  <p id={`${f.name}-error`} className="mt-1.5 text-[13px] text-sale">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="mt-8 font-bold uppercase">Phương thức thanh toán</h2>
        <label className="mt-3 flex items-center gap-3 rounded-md border border-accent bg-accent-soft p-4">
          <input type="radio" name="payment" defaultChecked className="size-4 accent-[#1f6fc5]" />
          <span>
            <span className="block font-semibold">Thanh toán khi nhận hàng (COD)</span>
            <span className="text-[13px] text-muted">Bạn được kiểm tra hàng trước khi thanh toán.</span>
          </span>
        </label>
      </div>

      <div className="space-y-4 lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-md border border-line p-6">
          <h2 className="flex items-center gap-2 font-bold uppercase">
            <Ticket size={18} className="text-sale" /> Mã giảm giá
          </h2>
          <div className="mt-3 flex gap-2">
            <input
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
              placeholder="Nhập mã, vd: AURA30K"
              className="input h-10 flex-1 uppercase"
              aria-label="Mã giảm giá"
            />
            <button type="button" onClick={() => setAppliedCode(voucherInput.trim() || null)} className="btn btn-outline h-10 px-4">
              Áp dụng
            </button>
          </div>
          {voucherError && <p className="mt-2 text-[13px] text-sale">{voucherError}</p>}
          {voucher?.ok && (
            <p className="mt-2 flex items-center justify-between text-[13px] text-success">
              Đã áp dụng mã {voucher.voucher.code}
              <button type="button" onClick={() => setAppliedCode(null)} className="text-muted underline">
                Bỏ mã
              </button>
            </p>
          )}
        </div>

        <OrderSummary subtotal={subtotal} discount={discount}>
          <ul className="mt-5 space-y-3 border-t border-line pt-5">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3 text-sm">
                <span className="relative block aspect-[37/48] w-12 shrink-0 overflow-hidden bg-surface">
                  <Image src={i.image} alt="" fill unoptimized className={i.image.endsWith(".svg") ? "object-contain p-1" : "object-cover"} />
                </span>
                <span className="flex-1">
                  {i.name}
                  <span className="block text-xs text-muted">
                    {i.colorName} / {i.size} × {i.quantity}
                  </span>
                </span>
                <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {result?.message && (
            <p className="mt-4 text-sm text-sale" role="alert">
              {result.message}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full uppercase">
            {pending && <Loader2 size={16} className="animate-spin" />}
            {pending ? "Đang gửi đơn…" : "Hoàn tất đặt hàng"}
          </button>
        </OrderSummary>
      </div>
    </form>
  );
}
