// Dữ liệu sản phẩm mẫu. File này được dùng ở 2 nơi:
//  1. scripts/generate-garments.ts — vẽ hình áo SVG cho từng màu
//  2. prisma/seed.ts — đổ dữ liệu vào database
// Muốn thêm sản phẩm: thêm vào mảng PRODUCTS rồi chạy `npm run garments && npm run db:seed`.

export type GarmentStyle = "tee" | "shirt" | "polo" | "knit" | "turtleneck" | "blazer";
export type SleeveLength = "short" | "long";

export const COLORS = {
  noir: { name: "Đen tuyền", hex: "#1D1C1B" },
  ivory: { name: "Trắng ngà", hex: "#EFE9DF" },
  cream: { name: "Kem", hex: "#E3D7C1" },
  camel: { name: "Nâu lạc đà", hex: "#B08A5E" },
  chocolate: { name: "Nâu sô-cô-la", hex: "#4A3329" },
  navy: { name: "Xanh than", hex: "#1F2940" },
  sky: { name: "Xanh sương", hex: "#B7C6D6" },
  olive: { name: "Xanh rêu", hex: "#5B6046" },
  bordeaux: { name: "Đỏ rượu vang", hex: "#5C1E29" },
  smoke: { name: "Xám khói", hex: "#8E8B86" },
} as const;

export type ColorKey = keyof typeof COLORS;

export const CATEGORIES = [
  { slug: "so-mi", name: "Áo sơ mi" },
  { slug: "thun-polo", name: "Áo thun & Polo" },
  { slug: "ao-len", name: "Áo len" },
  { slug: "blazer", name: "Blazer" },
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
  isNew?: boolean;
  featured?: boolean;
  fitWidth?: number;
};

export const PRODUCTS: CatalogProduct[] = [
  {
    slug: "so-mi-lua-silk-essential",
    name: "Sơ mi lụa Silk Essential",
    category: "so-mi",
    description:
      "Chiếc sơ mi lụa tơ tằm với độ rủ tự nhiên, bề mặt ánh nhẹ dưới ánh sáng. Phom suông thanh lịch, phù hợp từ phòng họp đến bữa tối.",
    material: "100% lụa tơ tằm, dệt satin 22 momme",
    price: 2490000,
    style: "shirt",
    sleeve: "long",
    colors: ["ivory", "noir", "sky"],
    isNew: true,
    featured: true,
  },
  {
    slug: "so-mi-oxford-may-do",
    name: "Sơ mi Oxford may đo",
    category: "so-mi",
    description:
      "Vải Oxford dày dặn, cổ button-down cổ điển. Đường may kép chắc chắn, càng mặc càng mềm.",
    material: "100% cotton Oxford chải kỹ",
    price: 1690000,
    style: "shirt",
    sleeve: "long",
    colors: ["sky", "ivory", "navy"],
  },
  {
    slug: "so-mi-linen-cuban",
    name: "Sơ mi Linen cổ Cuba",
    category: "so-mi",
    description:
      "Sơ mi tay ngắn cổ Cuba bằng vải lanh thoáng mát, dành cho những ngày nắng nhẹ và kỳ nghỉ ven biển.",
    material: "100% linen châu Âu",
    price: 1590000,
    compareAtPrice: 1890000,
    style: "shirt",
    sleeve: "short",
    colors: ["cream", "olive", "noir"],
  },
  {
    slug: "ao-thun-supima",
    name: "Áo thun Supima Cotton",
    category: "thun-polo",
    description:
      "Áo thun cổ tròn từ sợi Supima dài, mịn như lụa, giữ phom sau nhiều lần giặt. Món đồ nền tảng của mọi tủ đồ.",
    material: "100% Supima cotton, 180gsm",
    price: 890000,
    style: "tee",
    sleeve: "short",
    colors: ["ivory", "noir", "smoke"],
    featured: true,
  },
  {
    slug: "polo-det-kim-riviera",
    name: "Polo dệt kim Riviera",
    category: "thun-polo",
    description:
      "Polo dệt kim mắt nhỏ, cổ mềm không cần là. Gợi cảm hứng nghỉ dưỡng Địa Trung Hải.",
    material: "70% cotton, 30% lụa",
    price: 1490000,
    style: "polo",
    sleeve: "short",
    colors: ["navy", "cream", "chocolate"],
    isNew: true,
  },
  {
    slug: "polo-pique-classic",
    name: "Polo Piqué Classic",
    category: "thun-polo",
    description: "Polo vải piqué kinh điển với nẹp ba khuy xà cừ, đứng phom và lịch lãm.",
    material: "100% cotton piqué",
    price: 1190000,
    style: "polo",
    sleeve: "short",
    colors: ["noir", "ivory", "bordeaux"],
  },
  {
    slug: "ao-len-co-lo-cashmere",
    name: "Áo len cổ lọ Cashmere",
    category: "ao-len",
    description:
      "Cashmere Mông Cổ siêu nhẹ mà ấm. Cổ lọ ôm vừa vặn, phối cùng blazer cho vẻ ngoài thanh lịch mùa đông.",
    material: "100% cashmere, sợi 2-ply",
    price: 3290000,
    style: "turtleneck",
    sleeve: "long",
    colors: ["camel", "noir", "bordeaux"],
    featured: true,
  },
  {
    slug: "ao-len-merino-co-tron",
    name: "Áo len Merino cổ tròn",
    category: "ao-len",
    description:
      "Len Merino mịn, thoáng khí, không gây ngứa. Bo gân ở cổ, tay và gấu áo giữ dáng gọn gàng.",
    material: "100% len Merino extra-fine",
    price: 1990000,
    compareAtPrice: 2390000,
    style: "knit",
    sleeve: "long",
    colors: ["smoke", "navy", "cream"],
  },
  {
    slug: "blazer-wool-tailored",
    name: "Blazer len Wool Tailored",
    category: "blazer",
    description:
      "Blazer hai khuy may đo với vai dựng nhẹ, ve áo khía chữ V. Lớp lót cupro mềm mát, chuẩn mực của sự lịch lãm.",
    material: "100% len Ý Super 110s, lót cupro",
    price: 4890000,
    style: "blazer",
    sleeve: "long",
    colors: ["noir", "navy", "camel"],
    featured: true,
    fitWidth: 1.06,
  },
  {
    slug: "blazer-linen-ete",
    name: "Blazer Linen Été",
    category: "blazer",
    description:
      "Blazer không lót bằng linen pha lụa, nhẹ như áo sơ mi. Lựa chọn hoàn hảo cho tiệc ngoài trời mùa hè.",
    material: "55% linen, 45% lụa",
    price: 3590000,
    style: "blazer",
    sleeve: "long",
    colors: ["cream", "olive"],
    isNew: true,
    fitWidth: 1.06,
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
