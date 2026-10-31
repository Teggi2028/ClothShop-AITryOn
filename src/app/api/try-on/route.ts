import { z } from "zod";
import { TryOnError, generateTryOn } from "@/features/try-on/virtual-try-on";
import { getProductBySlug } from "@/lib/products";

// POST /api/try-on — nhận ảnh người + mẫu áo đã chọn, trả về ảnh AI (JPEG).
// AI thường mất 20–60 giây, cho phép tối đa 3 phút.
export const maxDuration = 180;

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB

const fieldsSchema = z.object({
  slug: z.string().min(1).max(120),
  color: z.string().min(1).max(60),
});

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  const fields = fieldsSchema.safeParse({ slug: form?.get("slug"), color: form?.get("color") });

  if (!(photo instanceof File) || !fields.success) {
    return Response.json({ error: "Thiếu ảnh hoặc mẫu áo." }, { status: 400 });
  }
  if (!photo.type.startsWith("image/")) {
    return Response.json({ error: "Tệp tải lên không phải là ảnh." }, { status: 400 });
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return Response.json({ error: "Ảnh quá lớn (tối đa 10MB)." }, { status: 413 });
  }

  // Lấy ảnh áo từ database (không tin đường dẫn do trình duyệt gửi lên)
  const product = await getProductBySlug(fields.data.slug);
  const color = product?.colors.find((c) => c.key === fields.data.color);
  if (!product || !color) {
    return Response.json({ error: "Không tìm thấy mẫu áo." }, { status: 404 });
  }

  try {
    const image = await generateTryOn({
      person: Buffer.from(await photo.arrayBuffer()),
      garmentPath: color.image, // ảnh toàn thân áo, nền trắng
      category: product.category.slug,
    });
    return new Response(new Uint8Array(image), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof TryOnError) return Response.json({ error: e.message }, { status: e.status });
    console.error("[try-on]", e);
    return Response.json({ error: "Có lỗi khi tạo ảnh. Bạn thử lại nhé." }, { status: 500 });
  }
}
