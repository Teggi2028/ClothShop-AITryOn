// Chuyển dữ liệu áo nam tải từ savani.vn thành dữ liệu của cửa hàng. Chạy: npm run import:savani
//
// Đầu vào (thư mục Cloth/ — không đưa lên GitHub):
//   Cloth/savani-ao-nam/savani-products.json  dữ liệu gốc từ savani.vn/collections/nam/products.json (chỉ các loại "Áo …")
//   Cloth/savani-ao-nam/<loai-ao>/*.jpg        ảnh đại diện của từng màu (ảnh toàn thân áo, nền trắng)
// Đầu ra:
//   public/products/savani/*.jpg  ảnh dùng trên web (cũng không đưa lên GitHub)
//   src/data/products.json        danh sách sản phẩm → prisma/seed.ts đổ vào database
//
// Mô tả sản phẩm được TỰ GHÉP từ kiểu dáng + chất liệu, không chép văn quảng cáo của Savani.

import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { CatalogProduct, CategorySlug, ColorFamily, Sleeve } from "../src/data/catalog";

const SOURCE_DIR = "Cloth/savani-ao-nam";
const PUBLIC_DIR = "public/products/savani";
const OUTPUT = "src/data/products.json";
const FEATURED_PER_CATEGORY = 2;

type SavaniProduct = {
  handle: string;
  title: string;
  product_type: string;
  tags: string;
  created_at: string;
  images: { id: number; src: string }[];
  options: { name: string; position: number; values: string[] }[];
  variants: { option1: string | null; option2: string | null; option3: string | null; price: number; compare_at_price: number; image_id: number | null }[];
};

// Loại áo bên Savani → danh mục của cửa hàng
const CATEGORY_BY_TYPE: Record<string, CategorySlug> = {
  "Áo sơ mi nam ngắn tay": "so-mi",
  "Áo sơ mi nam dài tay": "so-mi",
  "Áo polo nam": "polo",
  "Áo T-shirt nam": "thun",
  "Áo thun dài tay nam": "thun",
  "Áo giữ nhiệt nam": "thun",
  "Áo ba lỗ nam": "thun",
  "Áo nỉ nam": "ao-ni",
  "Áo khoác nam": "ao-khoac",
  "Áo gió nam": "ao-khoac",
};

// Xét lần lượt từ trên xuống, khớp quy tắc đầu tiên. Chỉ xét phần tên màu trước mã số ("Xám 001-tím than" → "xám").
const FAMILY_RULES: [RegExp, ColorFamily][] = [
  [/tím than|navy/, "xanh-than"],
  [/rêu|olive|ve chai|vỏ đậu|xanh lá/, "xanh-reu"],
  [/mint|bạc hà|ngọc|cổ vịt/, "xanh-mint"],
  [/^(xám|ghi)/, "xam"],
  [/^(xanh|biển)/, "xanh-duong"],
  [/^trắng/, "trang"],
  [/^đen/, "den"],
  [/^be/, "be"],
  [/^nâu/, "nau"],
  [/^tím/, "tim"],
  [/^hồng/, "hong"],
  [/^(đô|đỏ)/, "do"],
  [/^(cam|vàng)/, "cam-vang"],
];

function colorFamily(name: string): ColorFamily {
  const base = name.toLowerCase().split(/\d/)[0].trim();
  const rule = FAMILY_RULES.find(([re]) => re.test(base));
  if (!rule) throw new Error(`Chưa có họ màu cho "${name}" — thêm vào FAMILY_RULES`);
  return rule[1];
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// "TÍM THAN 010" → "Tím than 010"
const prettyColor = (name: string) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

function sleeveOf(p: SavaniProduct): Sleeve {
  const text = `${p.title} ${p.product_type}`.toLowerCase();
  if (/ba lỗ|sát nách|không tay/.test(text)) return "none";
  if (/dài tay|tay dài/.test(text)) return "long";
  if (/ngắn tay|cộc tay|tay ngắn|polo|t-shirt/.test(text)) return "short";
  return "long"; // áo khoác, áo gió, áo nỉ, giữ nhiệt
}

const tag = (p: SavaniProduct, prefix: string) =>
  p.tags
    .split(",")
    .find((t) => t.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();

// Màu chủ đạo của áo: lấy vùng giữa ảnh (thân áo) để tránh nền trắng xung quanh.
// Lưu ý: stats() đo trên ảnh GỐC nên phải cắt ra ảnh mới (toBuffer) rồi mới đo.
async function dominantHex(file: string) {
  const { width = 0, height = 0 } = await sharp(file).metadata();
  const center = await sharp(file)
    .extract({ left: Math.round(width * 0.38), top: Math.round(height * 0.35), width: Math.round(width * 0.24), height: Math.round(height * 0.3) })
    .toBuffer();
  const { dominant } = await sharp(center).stats();
  return "#" + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// Ảnh áo trải phẳng có nền sáng, đều màu ở sát viền. Ảnh người mẫu chụp ngoài cảnh / áo treo móc / ảnh cận
// thì viền tối và loang lổ → điểm cao. Đo trên 624 ảnh: ảnh chuẩn ≤ 41 điểm, ảnh không đạt ≥ 65 điểm.
const FLAT_LAY_MAX_SCORE = 50;

async function borderScore(file: string) {
  const { data, info } = await sharp(file).resize(40, 52, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x > 1 && x < info.width - 2 && y > 1 && y < info.height - 2) continue; // chỉ xét viền 2 pixel
      const i = (y * info.width + x) * 3;
      const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
      n++;
      sum += v;
      sumSq += v * v;
    }
  }
  const mean = sum / n;
  return Math.sqrt(sumSq / n - mean * mean) + (255 - mean); // độ loang lổ + độ tối
}

async function main() {
  if (!existsSync(SOURCE_DIR)) throw new Error(`Không thấy thư mục ${SOURCE_DIR}`);
  const raw = JSON.parse(await readFile(path.join(SOURCE_DIR, "savani-products.json"), "utf8")) as SavaniProduct[];

  // Tên file ảnh → đường dẫn trong Cloth/savani-ao-nam/<loai-ao>/
  const files = new Map<string, string>();
  for (const dir of await readdir(SOURCE_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const name of await readdir(path.join(SOURCE_DIR, dir.name))) files.set(name, path.join(SOURCE_DIR, dir.name, name));
  }

  await mkdir(PUBLIC_DIR, { recursive: true });
  const products: CatalogProduct[] = [];
  const featuredCount: Partial<Record<CategorySlug, number>> = {};
  const skippedColors = new Set<string>();
  const notFlatLay = new Set<string>();

  for (const p of raw) {
    const category = CATEGORY_BY_TYPE[p.product_type];
    if (!category) continue;
    const colorIndex = p.options.findIndex((o) => o.name.startsWith("Màu"));
    const sizeOption = p.options.find((o) => o.name.startsWith("Kích") || o.name.toLowerCase().startsWith("size"));
    const imageById = new Map(p.images.map((i) => [i.id, i.src]));

    const colors: CatalogProduct["colors"] = [];
    for (const variant of p.variants) {
      const colorName = [variant.option1, variant.option2, variant.option3][colorIndex];
      if (!colorName || colors.some((c) => c.name === prettyColor(colorName))) continue;
      const label = `${p.title} — ${prettyColor(colorName)}`;
      if (notFlatLay.has(label)) continue;
      const fileName = imageById.get(variant.image_id ?? -1)?.split("/").pop();
      const source = fileName && files.get(fileName);
      if (!source) {
        skippedColors.add(`${p.handle}/${colorName}`); // màu không có ảnh đại diện
        continue;
      }
      // Phòng thử AI cần ảnh chỉ có cái áo → bỏ màu mà ảnh đại diện là ảnh người mẫu / áo treo
      if ((await borderScore(source)) > FLAT_LAY_MAX_SCORE) {
        notFlatLay.add(label);
        continue;
      }
      const target = path.join(PUBLIC_DIR, fileName);
      if (!existsSync(target)) await copyFile(source, target);
      let key = slugify(colorName);
      while (colors.some((c) => c.key === key)) key += "-2";
      colors.push({
        key,
        name: prettyColor(colorName),
        family: colorFamily(colorName),
        hex: await dominantHex(source),
        image: `/products/savani/${fileName}`,
      });
    }
    if (colors.length === 0) continue;

    const fit = tag(p, "kieudang_");
    const material = tag(p, "chatlieu_") ?? "Đang cập nhật";
    const price = Math.round(p.variants[0].price);
    const compareAt = Math.round(p.variants[0].compare_at_price);
    featuredCount[category] = (featuredCount[category] ?? 0) + 1;

    products.push({
      slug: p.handle,
      name: p.title,
      category,
      description: [`${p.title}.`, fit && `Kiểu dáng ${fit}.`, `Chất liệu ${material}.`].filter(Boolean).join(" "),
      material,
      price,
      compareAtPrice: compareAt > price ? compareAt : null,
      sizes: sizeOption?.values ?? ["M", "L", "XL"],
      sleeve: sleeveOf(p),
      isNew: p.tags.includes("promotag_hangmoive"),
      // Savani xếp sản phẩm nổi bật lên đầu danh mục → lấy vài mẫu đầu mỗi danh mục làm "bán chạy"
      featured: featuredCount[category]! <= FEATURED_PER_CATEGORY,
      createdAt: p.created_at,
      source: `https://savani.vn/products/${p.handle}`,
      colors,
    });
  }

  await writeFile(OUTPUT, JSON.stringify(products, null, 2) + "\n");
  const colorCount = products.reduce((n, p) => n + p.colors.length, 0);
  console.log(`Đã tạo ${products.length} sản phẩm, ${colorCount} màu → ${OUTPUT}`);
  console.log(`Bỏ qua ${skippedColors.size} màu không có ảnh, ${notFlatLay.size} màu chỉ có ảnh người mẫu/áo treo:`);
  for (const name of notFlatLay) console.log(`  - ${name}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
