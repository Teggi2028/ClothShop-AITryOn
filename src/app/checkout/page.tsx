import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Đặt hàng" };

export default function CheckoutPage() {
  return (
    <div className="container-lux pt-16">
      <h1 className="text-center font-serif text-5xl font-medium">Đặt hàng</h1>
      <CheckoutForm />
    </div>
  );
}
