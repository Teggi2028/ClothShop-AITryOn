import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Đặt hàng" };

export default function CheckoutPage() {
  return (
    <div className="container-shop">
      <Breadcrumb items={[{ label: "Giỏ hàng", href: "/cart" }, { label: "Đặt hàng" }]} />
      <h1 className="section-title mt-8">Thông tin đặt hàng</h1>
      <CheckoutForm />
    </div>
  );
}
