import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default function CartPage() {
  return (
    <div className="container-lux pt-16">
      <h1 className="text-center font-serif text-5xl font-medium">Giỏ hàng</h1>
      <CartView />
    </div>
  );
}
