"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { OrderSummary } from "@/components/OrderSummary";
import { formatPrice } from "@/lib/format";
import { cartSubtotal, useCart, useHydrated } from "@/stores/cart";
import { type CheckoutField, type CheckoutResult, placeOrder } from "./actions";

const FIELDS: { name: CheckoutField; label: string; type?: string; autoComplete?: string; textarea?: boolean; optional?: boolean }[] = [
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

  if (!hydrated) return <p className="py-24 text-center text-sm text-stone">Đang tải…</p>;

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone">Giỏ hàng đang trống nên chưa thể đặt hàng.</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Đến cửa hàng
        </Link>
      </div>
    );
  }

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
    <form onSubmit={handleSubmit} className="mt-14 grid gap-12 lg:grid-cols-[1fr_420px]" noValidate>
      <div>
        <p className="eyebrow">Thông tin giao hàng</p>
        <div className="mt-6 grid gap-6">
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
              <div key={f.name}>
                <label htmlFor={f.name} className="text-xs tracking-[0.12em] text-stone uppercase">
                  {f.label}
                  {f.optional && <span className="normal-case tracking-normal"> (không bắt buộc)</span>}
                </label>
                {f.textarea ? (
                  <textarea {...common} rows={3} className="input-line h-auto resize-none py-3" />
                ) : (
                  <input {...common} type={f.type ?? "text"} className="input-line" />
                )}
                {error && (
                  <p id={`${f.name}-error`} className="mt-2 text-sm text-danger">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="eyebrow mt-12">Phương thức thanh toán</p>
        <label className="mt-5 flex items-center gap-4 border border-noir bg-pearl p-5">
          <input type="radio" name="payment" defaultChecked className="size-4 accent-[#121212]" />
          <span>
            <span className="block text-sm font-medium">Thanh toán khi nhận hàng (COD)</span>
            <span className="text-xs text-stone">Bạn được kiểm tra hàng trước khi thanh toán.</span>
          </span>
        </label>
      </div>

      <div className="lg:sticky lg:top-36 lg:self-start">
        <OrderSummary subtotal={cartSubtotal(items)}>
          <ul className="mt-6 space-y-4 border-t border-line pt-6">
            {items.map((i) => (
              <li key={i.key} className="flex gap-4 text-sm">
                <span className="relative block aspect-[4/5] w-14 shrink-0 bg-sand">
                  <Image src={i.image} alt="" fill unoptimized className="object-contain p-1" />
                </span>
                <span className="flex-1">
                  {i.name}
                  <span className="block text-xs text-stone">
                    {i.colorName} · {i.size} · SL {i.quantity}
                  </span>
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {result?.message && (
            <p className="mt-6 text-sm text-danger" role="alert">
              {result.message}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-primary mt-8 w-full">
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            {pending ? "Đang gửi đơn…" : "Hoàn tất đặt hàng"}
          </button>
        </OrderSummary>
      </div>
    </form>
  );
}
