// Dữ liệu sản phẩm của cửa hàng. Được dùng ở 2 nơi:
//  1. scripts/import-savani.ts — chuyển dữ liệu áo tải từ savani.vn (thư mục Cloth/savani-ao-nam) thành products.json
//  2. prisma/seed.ts — đổ products.json vào database
// Cập nhật sản phẩm: `npm run import:savani && npm run db:seed`.
// Ảnh & dữ liệu áo thuộc bản quyền Savani (savani.vn) — chỉ dùng cho đồ án, không đưa lên mạng công khai.

import products from "./products.json";

export const CATEGORIES = [
  { slug: "so-mi", name: "Áo sơ mi" },
  { slug: "polo", name: "Áo polo" },
  { slug: "thun", name: "Áo thun & giữ nhiệt" },
  { slug: "ao-ni", name: "Áo nỉ" },
  { slug: "ao-khoac", name: "Áo khoác & áo gió" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

// Tên màu gốc rất chi tiết ("XANH 011", "TÍM THAN 010"…) → gom thành họ màu cho bộ lọc
export const COLOR_FAMILIES = {
  den: { name: "Đen", hex: "#1D1C1B" },
  trang: { name: "Trắng", hex: "#F4F3EF" },
  xam: { name: "Xám", hex: "#8E8E8E" },
  be: { name: "Be", hex: "#D8C8AE" },
  nau: { name: "Nâu", hex: "#7A5A43" },
  "xanh-than": { name: "Xanh than", hex: "#232B45" },
  "xanh-duong": { name: "Xanh dương", hex: "#5B88C0" },
  "xanh-mint": { name: "Xanh mint", hex: "#9FD3C7" },
  "xanh-reu": { name: "Xanh rêu", hex: "#5B6046" },
  tim: { name: "Tím", hex: "#7B6A9C" },
  hong: { name: "Hồng", hex: "#E3A9B5" },
  do: { name: "Đỏ", hex: "#A3242E" },
  "cam-vang": { name: "Cam & vàng", hex: "#E3A23B" },
} as const;

export type ColorFamily = keyof typeof COLOR_FAMILIES;
export type Sleeve = "long" | "short" | "none";

export type CatalogProduct = {
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  material: string;
  price: number;
  compareAtPrice: number | null;
  sizes: string[];
  sleeve: Sleeve;
  isNew: boolean;
  featured: boolean;
  createdAt: string;
  source: string; // trang sản phẩm gốc — để ghi nguồn
  colors: { key: string; name: string; family: ColorFamily; hex: string; image: string }[];
};

export const PRODUCTS = products as CatalogProduct[];
