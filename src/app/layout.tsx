import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// Mulish: font không chân, gọn gàng, có đủ dấu tiếng Việt
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.fullName} — Thời trang nam, thử đồ bằng camera`,
    template: `%s | ${BRAND.fullName}`,
  },
  description: `${BRAND.tagline} Áo sơ mi, polo, áo thun, áo len, áo khoác nam.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${mulish.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
