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
    <div className="container-shop max-w-3xl pt-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-success" size={56} strokeWidth={1.5} />
        <h1 className="section-title mt-4">Đặt hàng thành công!</h1>
        <p className="mt-2 text-muted">
          Mã đơn hàng: <span className="font-bold text-ink">{order.code}</span>. Chúng tôi sẽ gọi xác nhận tới số{" "}
          <span className="font-semibold text-ink">{order.phone}</span> trong thời gian sớm nhất.
        </p>
      </div>

      <div className="mt-10 rounded-md border border-line p-6">
        <h2 className="font-bold uppercase">Chi tiết đơn hàng</h2>
        <ul className="mt-3 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-6 py-3 text-sm">
              <span>
                {item.productName}
                <span className="block text-xs text-muted">
                  {item.colorName} / {item.size} × {item.quantity}
                </span>
              </span>
              <span className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Tạm tính</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Giảm giá ({order.voucherCode})</dt>
              <dd className="text-sale">-{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Phí giao hàng</dt>
            <dd>{order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-bold">Tổng thanh toán (COD)</dt>
            <dd className="text-xl font-extrabold text-sale">{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <div className="mt-6 rounded bg-surface p-4 text-sm">
          <p className="font-bold">Giao đến</p>
          <p className="mt-1">{order.customerName}</p>
          <p className="text-muted">{order.address}</p>
          {order.note && <p className="mt-1 text-muted italic">Ghi chú: {order.note}</p>}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="btn btn-primary">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
