import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default function CartPage() {
  return (
    <div className="container-shop">
      <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
      <h1 className="section-title mt-8">Giỏ hàng của bạn</h1>
      <CartView />
    </div>
  );
}
