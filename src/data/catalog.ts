// Dữ liệu sản phẩm mẫu. File này được dùng ở 2 nơi:
//  1. scripts/generate-garments.ts — vẽ hình áo SVG cho từng màu
//  2. prisma/seed.ts — đổ dữ liệu vào database
// Muốn thêm sản phẩm: thêm vào mảng PRODUCTS rồi chạy `npm run garments && npm run db:seed`.

export type GarmentStyle = "tee" | "shirt" | "polo" | "knit" | "turtleneck" | "blazer";
export type SleeveLength = "short" | "long";

export const COLORS = {
  noir: { name: "Đen", hex: "#1D1C1B" },
  ivory: { name: "Trắng ngà", hex: "#EFE9DF" },
  cream: { name: "Kem", hex: "#E3D7C1" },
  camel: { name: "Nâu lạc đà", hex: "#B08A5E" },
  khaki: { name: "Nâu khaki", hex: "#7C6B57" },
  chocolate: { name: "Nâu sô-cô-la", hex: "#4A3329" },
  navy: { name: "Xanh than", hex: "#1F2940" },
  sky: { name: "Xanh sương", hex: "#B7C6D6" },
  olive: { name: "Xanh rêu", hex: "#5B6046" },
  bordeaux: { name: "Đỏ đô", hex: "#5C1E29" },
  smoke: { name: "Xám khói", hex: "#8E8B86" },
  graphite: { name: "Xám than", hex: "#4B4B4D" },
  steel: { name: "Xám xanh", hex: "#8A9099" },
} as const;

export type ColorKey = keyof typeof COLORS;

export const CATEGORIES = [
  { slug: "so-mi", name: "Áo sơ mi" },
  { slug: "polo", name: "Áo polo" },
  { slug: "thun", name: "Áo thun & giữ nhiệt" },
  { slug: "ao-len", name: "Áo len & nỉ" },
  { slug: "ao-khoac", name: "Áo khoác & blazer" },
] as const;

export type CatalogProduct = {
  slug: string;
  name: string;
  category: (typeof CATEGORIES)[number]["slug"];
  description: string;
  material: string;
  price: number;
  compareAtPrice?: number;
  style: GarmentStyle;
  sleeve: SleeveLength;
  colors: ColorKey[];
  // Ảnh chụp thật theo màu (đặt trong public/products/). Màu nào không có thì dùng hình minh hoạ SVG.
  photos?: Partial<Record<ColorKey, string>>;
  isNew?: boolean;
  featured?: boolean;
  fitWidth?: number;
};

export const PRODUCTS: CatalogProduct[] = [
  {
    slug: "so-mi-lua-silk-essential",
    name: "Áo sơ mi lụa tay dài Silk Essential",
    category: "so-mi",
    description:
      "Sơ mi lụa với độ rủ tự nhiên, bề mặt ánh nhẹ dưới ánh sáng. Phom suông thanh lịch, phù hợp đi làm lẫn đi tiệc.",
    material: "100% lụa tơ tằm",
    price: 890000,
    compareAtPrice: 1090000,
    style: "shirt",
    sleeve: "long",
    colors: ["ivory", "noir", "sky"],
    featured: true,
  },
  {
    slug: "so-mi-oxford-may-do",
    name: "Áo sơ mi Oxford cổ button-down",
    category: "so-mi",
    description: "Vải Oxford dày dặn, cổ button-down cổ điển. Đường may kép chắc chắn, càng mặc càng mềm.",
    material: "100% cotton Oxford",
    price: 450000,
    style: "shirt",
    sleeve: "long",
    colors: ["sky", "ivory", "navy"],
  },
  {
    slug: "so-mi-linen-cuban",
    name: "Áo sơ mi linen cổ Cuba tay ngắn",
    category: "so-mi",
    description: "Sơ mi tay ngắn cổ Cuba bằng vải lanh thoáng mát, dành cho những ngày nắng và chuyến đi biển.",
    material: "100% linen",
    price: 390000,
    compareAtPrice: 490000,
    style: "shirt",
    sleeve: "short",
    colors: ["cream", "olive", "noir"],
  },
  {
    slug: "ao-thun-supima",
    name: "Áo thun cổ tròn Supima Cotton",
    category: "thun",
    description: "Áo thun cổ tròn từ sợi Supima mịn, giữ phom sau nhiều lần giặt. Món đồ cơ bản của mọi tủ đồ.",
    material: "100% Supima cotton, 180gsm",
    price: 199000,
    compareAtPrice: 249000,
    style: "tee",
    sleeve: "short",
    colors: ["ivory", "noir", "smoke"],
    featured: true,
  },
  {
    slug: "polo-det-kim-riviera",
    name: "Áo polo dệt kim Riviera",
    category: "polo",
    description: "Polo dệt kim mắt nhỏ, cổ mềm không cần là. Lịch sự mà vẫn thoải mái.",
    material: "70% cotton, 30% lụa",
    price: 350000,
    style: "polo",
    sleeve: "short",
    colors: ["navy", "cream", "chocolate"],
  },
  {
    slug: "polo-pique-classic",
    name: "Áo polo Piqué Classic",
    category: "polo",
    description: "Polo vải piqué kinh điển với nẹp ba khuy, đứng phom và lịch lãm.",
    material: "100% cotton piqué",
    price: 290000,
    compareAtPrice: 350000,
    style: "polo",
    sleeve: "short",
    colors: ["noir", "ivory", "bordeaux"],
  },
  {
    slug: "ao-len-co-lo-cashmere",
    name: "Áo len cổ lọ Cashmere",
    category: "ao-len",
    description: "Len cashmere nhẹ mà ấm. Cổ lọ ôm vừa vặn, dễ phối cùng blazer cho mùa đông.",
    material: "100% cashmere",
    price: 990000,
    compareAtPrice: 1290000,
    style: "turtleneck",
    sleeve: "long",
    colors: ["camel", "noir", "bordeaux"],
    featured: true,
  },
  {
    slug: "ao-len-merino-co-tron",
    name: "Áo len Merino cổ tròn",
    category: "ao-len",
    description: "Len Merino mịn, thoáng khí, không gây ngứa. Bo gân ở cổ, tay và gấu áo giữ dáng gọn gàng.",
    material: "100% len Merino",
    price: 590000,
    compareAtPrice: 790000,
    style: "knit",
    sleeve: "long",
    colors: ["smoke", "navy", "cream"],
  },
  {
    slug: "blazer-wool-tailored",
    name: "Áo blazer len hai khuy",
    category: "ao-khoac",
    description: "Blazer hai khuy với vai dựng nhẹ, ve áo khía chữ V. Lớp lót mềm mát, chuẩn mực của sự lịch lãm.",
    material: "Len pha polyester, lót cupro",
    price: 1590000,
    compareAtPrice: 1990000,
    style: "blazer",
    sleeve: "long",
    colors: ["noir", "navy", "camel"],
    featured: true,
    fitWidth: 1.06,
  },
  {
    slug: "blazer-linen-ete",
    name: "Áo blazer linen mùa hè",
    category: "ao-khoac",
    description: "Blazer không lót bằng linen pha, nhẹ như áo sơ mi. Lựa chọn hoàn hảo cho tiệc ngoài trời.",
    material: "55% linen, 45% viscose",
    price: 1290000,
    style: "blazer",
    sleeve: "long",
    colors: ["cream", "olive"],
    fitWidth: 1.06,
  },

  // ===== Sản phẩm có ảnh chụp thật (thư mục Cloth/ → public/products/) =====
  {
    slug: "ao-khoac-co-be-khoa-keo",
    name: "Áo khoác nhẹ cổ bẻ khoá kéo",
    category: "ao-khoac",
    description: "Áo khoác nhẹ cổ bẻ, khoá kéo kim loại chạy dọc thân. Vải dệt mịn, đứng phom, dễ mặc đi làm hay dạo phố.",
    material: "Polyester pha spandex, co giãn nhẹ",
    price: 690000,
    compareAtPrice: 890000,
    style: "shirt",
    sleeve: "long",
    colors: ["navy"],
    photos: { navy: "/products/ao-khoac-co-be-khoa-keo-navy.webp" },
    isNew: true,
  },
  {
    slug: "ao-ni-raglan-in-chu",
    name: "Áo nỉ raglan in chữ Athletic",
    category: "ao-len",
    description: "Áo nỉ tay raglan, cổ tròn bo gân, in chữ phong cách thể thao trước ngực. Ấm áp cho những ngày se lạnh.",
    material: "Cotton pha polyester, mặt trong nỉ mịn",
    price: 450000,
    compareAtPrice: 590000,
    style: "knit",
    sleeve: "long",
    colors: ["graphite"],
    photos: { graphite: "/products/ao-ni-raglan-in-chu-graphite.webp" },
    isNew: true,
    featured: true,
  },
  {
    slug: "ao-polo-ni-tay-dai",
    name: "Áo polo nỉ tay dài",
    category: "polo",
    description: "Polo tay dài chất nỉ mỏng, cổ bẻ đứng dáng với nẹp ba khuy. Lịch sự như sơ mi, thoải mái như áo thun.",
    material: "Polyester, cotton, modal pha spandex",
    price: 440000,
    compareAtPrice: 550000,
    style: "polo",
    sleeve: "long",
    colors: ["khaki"],
    photos: { khaki: "/products/ao-polo-ni-tay-dai-khaki.jpg" },
    isNew: true,
  },
  {
    slug: "ao-giu-nhiet-co-cao",
    name: "Áo giữ nhiệt cổ cao",
    category: "thun",
    description: "Áo giữ nhiệt cổ cao ôm vừa, giữ ấm tốt mà vẫn mỏng nhẹ — mặc trong áo len hay blazer đều gọn gàng.",
    material: "Polyester pha spandex, mặt trong lót lông mịn",
    price: 159000,
    compareAtPrice: 249000,
    style: "turtleneck",
    sleeve: "long",
    colors: ["steel"],
    photos: { steel: "/products/ao-giu-nhiet-co-cao-steel.webp" },
    isNew: true,
  },
  {
    slug: "ao-giu-nhiet-co-tron",
    name: "Áo giữ nhiệt cổ tròn",
    category: "thun",
    description: "Áo giữ nhiệt cổ tròn co giãn bốn chiều, ôm nhẹ cơ thể. Món đồ không thể thiếu trong mùa đông.",
    material: "Polyester pha spandex",
    price: 129000,
    compareAtPrice: 249000,
    style: "tee",
    sleeve: "long",
    colors: ["noir"],
    photos: { noir: "/products/ao-giu-nhiet-co-tron-noir.webp" },
    isNew: true,
    featured: true,
  },
  {
    slug: "ao-mang-to-ngan",
    name: "Áo măng tô dáng ngắn",
    category: "ao-khoac",
    description: "Măng tô dáng ngắn cổ bẻ, hàng khuy che lịch lãm. Chất dạ dày dặn, giữ ấm tốt cho mùa đông.",
    material: "Dạ pha len",
    price: 1290000,
    compareAtPrice: 1590000,
    style: "blazer",
    sleeve: "long",
    colors: ["noir"],
    photos: { noir: "/products/ao-mang-to-ngan-noir.webp" },
    isNew: true,
    fitWidth: 1.08,
  },
];

export const SIZES = ["S", "M", "L", "XL"];

// Quy ước đường dẫn ảnh — script vẽ áo và seed đều dùng chung.
export function garmentPaths(slug: string, color: ColorKey, sleeve: SleeveLength) {
  const base = `/garments/${slug}-${color}`;
  return {
    image: `${base}.svg`,
    torsoAsset: `${base}-torso.svg`,
    sleeveUpperAsset: `${base}-sleeve-upper.svg`,
    sleeveLowerAsset: sleeve === "long" ? `${base}-sleeve-lower.svg` : null,
  };
}
