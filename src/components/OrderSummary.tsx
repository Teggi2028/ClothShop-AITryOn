import { SHIPPING } from "@/lib/brand";
import { formatPrice, shippingFeeFor } from "@/lib/format";

export function OrderSummary({
  subtotal,
  discount = 0,
  children,
}: {
  subtotal: number;
  discount?: number;
  children?: React.ReactNode;
}) {
  const shipping = shippingFeeFor(subtotal);
  return (
    <div className="rounded-md border border-line p-6">
      <h2 className="font-bold uppercase">Tóm tắt đơn hàng</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Tạm tính</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Giảm giá</dt>
            <dd className="text-sale">-{formatPrice(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Phí giao hàng</dt>
          <dd>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</dd>
        </div>
        {shipping > 0 && (
          <p className="rounded bg-accent-soft px-3 py-2 text-xs text-accent">
            Mua thêm {formatPrice(SHIPPING.freeFrom - subtotal)} để được miễn phí giao hàng.
          </p>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-bold">Tổng cộng</dt>
          <dd className="text-xl font-extrabold text-sale">{formatPrice(subtotal - discount + shipping)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
