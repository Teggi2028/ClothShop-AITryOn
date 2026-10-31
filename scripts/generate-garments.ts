// Vẽ hình minh hoạ áo (SVG) cho mọi sản phẩm × mọi màu trong src/data/catalog.ts.
// Chạy: npm run garments   → kết quả nằm trong public/garments/
//
// Mỗi màu sinh ra 4 file:
//   <slug>-<màu>.svg               ảnh "trải phẳng" hiển thị trong cửa hàng
//   <slug>-<màu>-torso.svg         thân áo nền trong suốt (dùng trong phòng thử)
//   <slug>-<màu>-sleeve-upper.svg  tay áo đoạn trên
//   <slug>-<màu>-sleeve-lower.svg  tay áo đoạn dưới (chỉ áo tay dài)
// Khi có ảnh chụp thật, chỉ cần thay các file này (giữ đúng mốc trong garment-geometry.ts).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COLORS, PRODUCTS, garmentPaths, type GarmentStyle } from "../src/data/catalog";
import { SLEEVE, TORSO } from "../src/features/try-on/garment-geometry";

const OUT_DIR = join(process.cwd(), "public");

// ---------- Màu sắc ----------
function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// amount > 0: pha trắng, amount < 0: pha đen
function shade(hex: string, amount: number) {
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const [r, g, b] = hexToRgb(hex).map((c) => Math.round(c + (target - c) * t));
  return `rgb(${r},${g},${b})`;
}
function isLight(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}
// Màu đường chỉ, khuy... luôn tương phản nhẹ với màu vải
function detail(hex: string, strength = 1) {
  return isLight(hex) ? shade(hex, -0.22 * strength) : shade(hex, 0.16 * strength);
}

// Lớp đổ bóng giúp vải trông có khối (tối ở hai mép, sáng nhẹ ở giữa)
function shadingDefs(id: string) {
  return `
    <linearGradient id="${id}-h" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.28"/>
      <stop offset="0.2" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.07"/>
      <stop offset="0.8" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.28"/>
    </linearGradient>
    <linearGradient id="${id}-v" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.14"/>
    </linearGradient>`;
}

// Gân dệt kim (sọc dọc mảnh) dùng cho áo len / cổ lọ / bo gân
function ribPattern(id: string, hex: string) {
  return `<pattern id="${id}-rib" width="6" height="10" patternUnits="userSpaceOnUse">
      <rect width="6" height="10" fill="${hex}"/>
      <rect width="2" height="10" fill="${shade(hex, -0.12)}"/>
    </pattern>`;
}

// ---------- Thân áo ----------
type TorsoShape = {
  shoulderOut: number; // mép vai nhô ra ngoài mốc vai bao nhiêu
  hemY: number;
  neckDepth: number; // độ sâu cổ áo phía trước
  waistIn: number; // độ chiết eo
  curvedHem: boolean; // gấu đuôi tôm kiểu sơ mi
};

const SHAPES: Record<GarmentStyle, TorsoShape> = {
  tee: { shoulderOut: 6, hemY: 338, neckDepth: 76, waistIn: 0, curvedHem: false },
  shirt: { shoulderOut: 6, hemY: 352, neckDepth: 70, waistIn: 2, curvedHem: true },
  polo: { shoulderOut: 6, hemY: 338, neckDepth: 70, waistIn: 0, curvedHem: false },
  knit: { shoulderOut: 8, hemY: 334, neckDepth: 72, waistIn: 4, curvedHem: false },
  turtleneck: { shoulderOut: 8, hemY: 334, neckDepth: 64, waistIn: 4, curvedHem: false },
  blazer: { shoulderOut: 14, hemY: 370, neckDepth: 60, waistIn: 10, curvedHem: false },
};

function torsoPath(style: GarmentStyle) {
  const s = SHAPES[style];
  const rX = TORSO.shoulderRight.x - s.shoulderOut;
  const lX = TORSO.shoulderLeft.x + s.shoulderOut;
  const y = TORSO.shoulderRight.y + 2;
  const hem = s.curvedHem
    ? `L 124 ${s.hemY - 22} Q 200 ${s.hemY + 14} 276 ${s.hemY - 22}`
    : `L 122 ${s.hemY} L 278 ${s.hemY}`;
  return [
    `M 166 52 L ${rX} ${y}`,
    `Q ${rX + 4} 124 ${118} 160`, // nách phải
    `Q ${122 + s.waistIn} 250 122 ${s.curvedHem ? s.hemY - 22 : s.hemY}`,
    hem,
    `Q ${278 - s.waistIn} 250 282 160`,
    `Q ${lX - 4} 124 ${lX} ${y}`,
    `L 234 52 Q 200 ${s.neckDepth} 166 52 Z`,
  ].join(" ");
}

function torsoDetails(style: GarmentStyle, hex: string, id: string) {
  const d = detail(hex);
  const d2 = detail(hex, 1.6);
  const s = SHAPES[style];
  switch (style) {
    case "tee":
      return `<path d="M 166 52 Q 200 ${s.neckDepth} 234 52" fill="none" stroke="${d}" stroke-width="7"/>
        <path d="M 160 49 Q 200 ${s.neckDepth + 8} 240 49" fill="none" stroke="${d}" stroke-width="1" opacity="0.6"/>`;
    case "shirt": {
      const buttons = [100, 146, 192, 238, 284, 326]
        .map((by) => `<circle cx="200" cy="${by}" r="3.6" fill="${d2}"/>`)
        .join("");
      return `<path d="M 160 54 Q 200 34 240 54 L 236 64 Q 200 48 164 64 Z" fill="${shade(hex, -0.08)}"/>
        <line x1="194" y1="66" x2="194" y2="${s.hemY - 4}" stroke="${d}" stroke-width="1.2"/>
        <line x1="206" y1="66" x2="206" y2="${s.hemY - 4}" stroke="${d}" stroke-width="1.2"/>
        ${buttons}
        <path d="M 164 52 L 200 70 L 188 100 L 150 74 Z" fill="${hex}" stroke="${d}" stroke-width="1.2"/>
        <path d="M 236 52 L 200 70 L 212 100 L 250 74 Z" fill="${hex}" stroke="${d}" stroke-width="1.2"/>`;
    }
    case "polo":
      return `<rect x="191" y="62" width="18" height="94" fill="${hex}" stroke="${d}" stroke-width="1.2"/>
        <circle cx="200" cy="96" r="3.4" fill="${d2}"/><circle cx="200" cy="134" r="3.4" fill="${d2}"/>
        <path d="M 164 52 L 200 66 L 186 92 L 154 72 Z" fill="${hex}" stroke="${d}" stroke-width="1.2"/>
        <path d="M 236 52 L 200 66 L 214 92 L 246 72 Z" fill="${hex}" stroke="${d}" stroke-width="1.2"/>
        <rect x="122" y="${s.hemY - 14}" width="156" height="14" fill="url(#${id}-rib)" opacity="0.9"/>`;
    case "knit":
      return `<path d="M 166 52 Q 200 ${s.neckDepth} 234 52" fill="none" stroke="url(#${id}-rib)" stroke-width="12"/>
        <rect x="122" y="${s.hemY - 26}" width="156" height="26" fill="url(#${id}-rib)"/>`;
    case "turtleneck":
      return `<path d="M 166 6 L 234 6 L 238 56 Q 200 ${s.neckDepth + 4} 162 56 Z" fill="url(#${id}-rib)"/>
        <path d="M 164 30 Q 200 38 236 30" fill="none" stroke="${shade(hex, -0.25)}" stroke-width="2"/>
        <rect x="122" y="${s.hemY - 26}" width="156" height="26" fill="url(#${id}-rib)"/>`;
    case "blazer": {
      const lapel = shade(hex, isLight(hex) ? -0.06 : 0.07);
      return `<path d="M 166 52 L 234 52 L 200 222 Z" fill="#F3F0EA"/>
        <path d="M 178 52 Q 200 64 222 52 L 214 76 L 200 70 L 186 76 Z" fill="#E4DFD6"/>
        <path d="M 166 52 L 136 128 L 151 132 L 142 146 L 200 222 Z" fill="${lapel}" stroke="${d}" stroke-width="1.2"/>
        <path d="M 234 52 L 264 128 L 249 132 L 258 146 L 200 222 Z" fill="${lapel}" stroke="${d}" stroke-width="1.2"/>
        <line x1="200" y1="222" x2="200" y2="${s.hemY}" stroke="${d2}" stroke-width="1.4"/>
        <circle cx="206" cy="246" r="4.5" fill="${d2}"/><circle cx="206" cy="290" r="4.5" fill="${d2}"/>
        <path d="M 132 318 L 178 318" stroke="${d2}" stroke-width="2"/><path d="M 222 318 L 268 318" stroke="${d2}" stroke-width="2"/>
        <path d="M 226 172 L 260 170" stroke="${d2}" stroke-width="1.6"/>`;
    }
  }
}

function torsoGroup(style: GarmentStyle, hex: string, id: string) {
  const path = torsoPath(style);
  const base = style === "knit" || style === "turtleneck" ? `url(#${id}-knit)` : hex;
  return `
    <clipPath id="${id}-clip"><path d="${path}"/></clipPath>
    <path d="${path}" fill="${base}"/>
    <g clip-path="url(#${id}-clip)">
      ${torsoDetails(style, hex, id)}
      <rect x="90" y="0" width="220" height="400" fill="url(#${id}-h)"/>
      <rect x="90" y="0" width="220" height="400" fill="url(#${id}-v)"/>
    </g>
    ${style === "turtleneck" ? torsoDetails(style, hex, id) : ""}`;
}

// ---------- Tay áo ----------
function sleeveUpperGroup(style: GarmentStyle, short: boolean, hex: string, id: string) {
  const d = detail(hex);
  const path = "M 4 16 Q 50 -12 96 16 L 88 300 L 12 300 Z";
  const hem = short
    ? style === "polo"
      ? `<rect x="10" y="276" width="80" height="24" fill="url(#${id}-rib)"/>`
      : `<line x1="11" y1="282" x2="89" y2="282" stroke="${d}" stroke-width="2"/>`
    : "";
  return `<clipPath id="${id}-su"><path d="${path}"/></clipPath>
    <path d="${path}" fill="${style === "knit" || style === "turtleneck" ? `url(#${id}-knit)` : hex}"/>
    <g clip-path="url(#${id}-su)">${hem}
      <rect width="100" height="300" fill="url(#${id}-h)"/></g>`;
}

function sleeveLowerGroup(style: GarmentStyle, hex: string, id: string) {
  const d2 = detail(hex, 1.6);
  const path = "M 12 0 L 88 0 L 82 300 L 18 300 Z";
  let cuff = "";
  if (style === "shirt")
    cuff = `<rect x="16" y="252" width="68" height="48" fill="${shade(hex, -0.05)}" stroke="${detail(hex)}" stroke-width="1.2"/>
      <circle cx="70" cy="276" r="3.4" fill="${d2}"/>`;
  if (style === "knit" || style === "turtleneck")
    cuff = `<rect x="16" y="246" width="68" height="54" fill="url(#${id}-rib)"/>`;
  if (style === "blazer")
    cuff = [258, 272, 286].map((cy) => `<circle cx="74" cy="${cy}" r="3.4" fill="${d2}"/>`).join("");
  return `<clipPath id="${id}-sl"><path d="${path}"/></clipPath>
    <path d="${path}" fill="${style === "knit" || style === "turtleneck" ? `url(#${id}-knit)` : hex}"/>
    <g clip-path="url(#${id}-sl)">${cuff}<rect width="100" height="300" fill="url(#${id}-h)"/></g>`;
}

function defs(hex: string, id: string) {
  return `<defs>${shadingDefs(id)}${ribPattern(id, hex)}
    <pattern id="${id}-knit" width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="5" height="5" fill="${hex}"/><rect width="1" height="5" fill="${shade(hex, -0.06)}"/>
    </pattern></defs>`;
}

// width/height cần có để trình duyệt biết kích thước gốc khi vẽ SVG lên <canvas>
const svg = (viewBox: string, body: string) => {
  const [, , w, h] = viewBox.split(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${body}</svg>\n`;
};

// Ảnh "trải phẳng": tay áo hơi dang ra hai bên, thân áo đè lên trên
function flatLay(style: GarmentStyle, short: boolean, hex: string, id: string) {
  const sw = SLEEVE.widthInTorsoUnits / SLEEVE.width;
  const upperLen = short ? 64 : 140;
  const lowerLen = 124;
  const angleUpper = short ? 38 : 16;
  const angleLower = 9;

  const sleeve = (side: 1 | -1) => {
    const sh = side === 1 ? TORSO.shoulderRight : TORSO.shoulderLeft;
    const a = (side * angleUpper * Math.PI) / 180;
    // lùi điểm nối lên một chút để tay áo dưới gối lên tay áo trên, không hở khe ở khuỷu
    const joint = upperLen - 12;
    const elbow = { x: sh.x - Math.sin(a) * joint, y: sh.y + Math.cos(a) * joint };
    const upper = `<g transform="translate(${sh.x} ${sh.y}) rotate(${side * angleUpper}) scale(${sw} ${upperLen / SLEEVE.height}) translate(-50 0)">${sleeveUpperGroup(style, short, hex, `${id}${side}`)}</g>`;
    if (short) return upper;
    const lower = `<g transform="translate(${elbow.x} ${elbow.y}) rotate(${side * angleLower}) scale(${sw * 0.95} ${lowerLen / SLEEVE.height}) translate(-50 0)">${sleeveLowerGroup(style, hex, `${id}${side}`)}</g>`;
    return lower + upper;
  };

  return `${defs(hex, `${id}1`)}${defs(hex, `${id}-1`)}${defs(hex, id)}
    ${sleeve(1)}${sleeve(-1)}${torsoGroup(style, hex, id)}`;
}

// ---------- Ghi file ----------
mkdirSync(join(OUT_DIR, "garments"), { recursive: true });
let count = 0;
for (const product of PRODUCTS) {
  for (const colorKey of product.colors) {
    const hex = COLORS[colorKey].hex;
    const short = product.sleeve === "short";
    const paths = garmentPaths(product.slug, colorKey, product.sleeve);
    const id = "g";

    const files: [string, string][] = [
      [paths.image, svg("-40 -10 480 420", flatLay(product.style, short, hex, id))],
      [paths.torsoAsset, svg(`0 0 ${TORSO.width} ${TORSO.height}`, defs(hex, id) + torsoGroup(product.style, hex, id))],
      [paths.sleeveUpperAsset, svg(`0 0 ${SLEEVE.width} ${SLEEVE.height}`, defs(hex, id) + sleeveUpperGroup(product.style, short, hex, id))],
    ];
    if (paths.sleeveLowerAsset)
      files.push([paths.sleeveLowerAsset, svg(`0 0 ${SLEEVE.width} ${SLEEVE.height}`, defs(hex, id) + sleeveLowerGroup(product.style, hex, id))]);

    for (const [p, content] of files) {
      writeFileSync(join(OUT_DIR, p), content);
      count++;
    }
  }
}
console.log(`Đã tạo ${count} file SVG trong public/garments/`);
