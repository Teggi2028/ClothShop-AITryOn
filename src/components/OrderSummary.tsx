import { SHIPPING } from "@/lib/brand";
import { formatPrice, shippingFeeFor } from "@/lib/format";

export function OrderSummary({ subtotal, children }: { subtotal: number; children?: React.ReactNode }) {
  const shipping = shippingFeeFor(subtotal);
  return (
    <div className="bg-pearl p-8">
      <p className="eyebrow">Tóm tắt đơn hàng</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-stone">Tạm tính</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone">Phí giao hàng</dt>
          <dd>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</dd>
        </div>
        {shipping > 0 && (
          <p className="text-xs text-gold-deep">Mua thêm {formatPrice(SHIPPING.freeFrom - subtotal)} để được miễn phí giao hàng.</p>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt>Tổng cộng</dt>
          <dd className="font-serif text-2xl">{formatPrice(subtotal + shipping)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
