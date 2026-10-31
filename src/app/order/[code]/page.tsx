import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Đặt hàng thành công" };

export default async function OrderPage({ params }: PageProps<"/order/[code]">) {
  const { code } = await params;
  const order = await db.order.findUnique({ where: { code }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="container-lux max-w-3xl pt-20">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-gold" size={44} strokeWidth={1} />
        <p className="eyebrow mt-6 text-gold-deep">Cảm ơn bạn</p>
        <h1 className="mt-3 font-serif text-5xl font-medium">Đơn hàng đã được ghi nhận</h1>
        <p className="mt-4 text-stone">
          Mã đơn của bạn là <span className="font-medium text-noir">{order.code}</span>. Chúng tôi sẽ gọi xác nhận tới số{" "}
          {order.phone} trong thời gian sớm nhất.
        </p>
      </div>

      <div className="mt-14 bg-pearl p-8">
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-6 py-4 text-sm">
              <span>
                {item.productName}
                <span className="block text-xs text-stone">
                  {item.colorName} · Size {item.size} · SL {item.quantity}
                </span>
              </span>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">Tạm tính</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">Phí giao hàng</dt>
            <dd>{order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt>Tổng thanh toán (COD)</dt>
            <dd className="font-serif text-2xl">{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <div className="mt-8 border-t border-line pt-6 text-sm">
          <p className="eyebrow">Giao đến</p>
          <p className="mt-3">{order.customerName}</p>
          <p className="text-stone">{order.address}</p>
          {order.note && <p className="mt-2 text-stone italic">Ghi chú: {order.note}</p>}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/shop" className="btn btn-primary">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
