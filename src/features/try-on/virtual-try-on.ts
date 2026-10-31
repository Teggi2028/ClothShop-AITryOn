import { Client } from "@gradio/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Thử đồ bằng AI — CHỈ chạy ở server (dùng file hệ thống + khoá bí mật).
// Mô hình IDM-VTON chạy miễn phí trên Hugging Face Space: nhận ảnh người + ảnh áo,
// trả về ảnh người đó đang mặc áo. GPU dùng chung nên có hàng chờ và hạn mức theo ngày.
// Thêm HF_TOKEN (token đọc của tài khoản Hugging Face) vào .env.local để có hạn mức riêng.

const SPACE = "yisol/IDM-VTON";
const TIMEOUT_MS = 150_000;
// Mô hình làm việc ở khung 3:4 (768×1024)
const WIDTH = 768;
const HEIGHT = 1024;

// Mô hình hiểu mô tả tiếng Anh → đổi danh mục sang câu mô tả ngắn
const GARMENT_DESCRIPTIONS: Record<string, string> = {
  "so-mi": "a men's button-up shirt",
  polo: "a men's polo shirt",
  thun: "a men's t-shirt",
  "ao-len": "a men's knit sweater",
  "ao-khoac": "a men's jacket",
};

export class TryOnError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// Giữ một kết nối dùng chung cho mọi lượt; kết nối hỏng thì lần sau tạo lại
let clientPromise: Promise<Client> | null = null;

function getClient() {
  const token = process.env.HF_TOKEN?.trim();
  clientPromise ??= Client.connect(SPACE, token?.startsWith("hf_") ? { token: token as `hf_${string}` } : {}).catch(
    (e) => {
      clientPromise = null;
      throw e;
    },
  );
  return clientPromise;
}

export async function generateTryOn({
  person,
  garmentPath,
  category,
}: {
  person: Buffer;
  garmentPath: string; // đường dẫn trong thư mục public, vd: /products/savani/mlsa068k6-5-w001__1__….jpg
  category: string;
}) {
  const [personImage, garmentImage] = await Promise.all([preparePerson(person), prepareGarment(garmentPath)]);

  let result;
  try {
    const client = await getClient();
    result = await withTimeout(
      client.predict("/tryon", {
        dict: { background: toBlob(personImage), layers: [], composite: null },
        garm_img: toBlob(garmentImage),
        garment_des: GARMENT_DESCRIPTIONS[category] ?? "a men's top",
        is_checked: true, // tự khoanh vùng áo trên người
        is_checked_crop: true, // tự cắt ảnh về 3:4 rồi ghép lại, nên ảnh ngang vẫn dùng được
        denoise_steps: 30,
        seed: 42,
      }),
    );
  } catch (e) {
    throw toTryOnError(e);
  }

  const output = (result.data as { url?: string }[])[0]?.url;
  if (!output) throw new TryOnError("Máy chủ AI không trả về ảnh. Bạn thử lại nhé.", 502);

  const response = await fetch(output);
  if (!response.ok) throw new TryOnError("Không tải được ảnh kết quả. Bạn thử lại nhé.", 502);
  // Nén PNG (~1MB) sang JPEG cho nhẹ
  return sharp(Buffer.from(await response.arrayBuffer()))
    .jpeg({ quality: 90 })
    .toBuffer();
}

// Xoay đúng chiều theo EXIF, thu nhỏ, đổi sang JPEG — đồng thời xoá EXIF (vị trí GPS, đời máy…)
async function preparePerson(input: Buffer) {
  try {
    return await sharp(input)
      .rotate()
      .resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    throw new TryOnError("Không đọc được ảnh. Hãy dùng ảnh JPG, PNG hoặc WebP.", 400);
  }
}

// Ảnh áo (SVG hoặc ảnh chụp) → JPEG nền trắng, đặt giữa khung 3:4
async function prepareGarment(garmentPath: string) {
  const publicDir = path.join(process.cwd(), "public");
  const file = path.join(publicDir, garmentPath);
  if (!file.startsWith(publicDir + path.sep)) throw new TryOnError("Ảnh áo không hợp lệ.", 400);

  return sharp(await readFile(file), { density: 300 }) // density: vẽ SVG ở độ phân giải cao cho nét
    .flatten({ background: "#ffffff" })
    .resize(WIDTH, HEIGHT, { fit: "contain", background: "#ffffff" })
    .jpeg({ quality: 95 })
    .toBuffer();
}

function toBlob(buffer: Buffer) {
  return new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
}

function withTimeout<T>(promise: Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TryOnError("timeout", 504)), TIMEOUT_MS);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

// Lỗi từ Space có nhiều dạng (Error, object có message…) → đổi sang câu dễ hiểu
function toTryOnError(e: unknown) {
  if (e instanceof TryOnError && e.status === 504) {
    return new TryOnError("Máy chủ AI đang quá tải nên phản hồi chậm. Bạn thử lại sau ít phút nhé.", 504);
  }
  const message = String((e as { message?: unknown })?.message ?? e);
  console.error("[try-on]", message);
  if (/quota/i.test(message)) {
    // Space báo dạng "... Try again in 23:46:07" → đổi sang "khoảng 23 giờ 46 phút"
    const wait = message.match(/try again in (\d+):(\d+):\d+/i);
    const when = wait ? `sau khoảng ${Number(wait[1]) ? `${Number(wait[1])} giờ ` : ""}${Number(wait[2])} phút` : "sau";
    return new TryOnError(
      `Đã hết lượt dùng GPU miễn phí. Bạn thử lại ${when}${process.env.HF_TOKEN ? "" : ", hoặc thêm HF_TOKEN để có hạn mức riêng"}.`,
      429,
    );
  }
  if (/queue is full|too many/i.test(message)) {
    return new TryOnError("Đang có nhiều người dùng máy chủ AI. Bạn đợi một lát rồi thử lại nhé.", 503);
  }
  clientPromise = null; // có thể Space vừa khởi động lại → lần sau kết nối mới
  return new TryOnError("Không kết nối được máy chủ AI. Kiểm tra mạng rồi thử lại nhé.", 502);
}
