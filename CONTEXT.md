# CONTEXT — Ghi chú để làm tiếp ở phiên sau

> Cập nhật: 31/10/2026. Đọc file này đầu tiên khi bắt đầu phiên làm việc mới.
> Tài liệu liên quan: [PLAN.md](PLAN.md) (lộ trình), [BRAND.md](BRAND.md) (giao diện), [README.md](README.md) (cách chạy).

## 1. Người dùng & cách làm việc
- Người mới dùng Linux Mint, nói tiếng Việt → giải thích ngắn gọn, dễ hiểu, giải thích lệnh trước khi chạy.
- Dự án là **đồ án** (không kinh doanh thật). Người dùng nhờ **viết code trực tiếp**.
- **Quy ước commit:** commit đứng tên người dùng (`Teggi2028`), **không** thêm dòng `Co-Authored-By` hay "Generated with ..." vào commit/PR.
- GitHub: repo riêng tư **Teggi2028/ClothShop-AITryOn**, nhánh `main`.

## 2. Dự án hiện có gì
**AURA Fashion** (tên tạm, đổi ở `src/lib/brand.ts`) — web bán **áo nam**, có phòng thử bằng camera laptop.

| Phần | Trạng thái |
|---|---|
| Giao diện | Phong cách bán lẻ giống bố cục **savani.vn** (nền trắng, giá đỏ, voucher, bộ lọc trái, font Mulish). Không dùng tên/logo Savani. |
| Trang | Trang chủ · Cửa hàng (lọc danh mục/màu/giá, sắp xếp, tìm kiếm không dấu) · Chi tiết · Giỏ hàng · Đặt hàng COD · Đặt hàng thành công · 404 |
| Mã giảm giá | `AURA30K/50K/100K/200K` (`src/lib/vouchers.ts`), kiểm tra cả ở trình duyệt và server |
| Dữ liệu | 16 sản phẩm (`src/data/catalog.ts`): 10 dùng hình minh hoạ SVG + 6 dùng ảnh thật trong `public/products/` |
| Phòng thử | `/try-on` — **AR 2D miễn phí**: MediaPipe Pose (chạy trên trình duyệt) → dán ảnh thân áo + tay áo (SVG) theo vai/khuỷu/cổ tay; chụp ảnh; tải ảnh lên thay camera |
| Kiểm tra | `npm run lint` + `npm run build` đều qua. Luồng đặt hàng + voucher đã test trên trình duyệt. **Camera thật chưa test** (trình duyệt của trợ lý bị chặn camera). |

**Công nghệ:** Next.js 16.4 (App Router, `cacheComponents` bật → hàm đọc DB dùng `"use cache"` + `cacheTag("products")`, trang dùng `searchParams`/`params` có `loading.tsx`), React 19, Tailwind 4 (token trong `src/app/globals.css`), Prisma **6.19** + SQLite (`prisma/dev.db`, không commit), Zustand (giỏ hàng localStorage), Zod 4, lucide-react.

**Chạy:** `npm install` → `npm run db:setup` → `npm run dev` → http://localhost:3000
Sau khi sửa catalog: `npm run garments && npm run db:seed`.

## 3. Ảnh sản phẩm
- 6 ảnh người dùng đưa vào `Cloth/` (được `.gitignore`), đã chép sang `public/products/`.
- Đây là **ảnh cận cổ áo** tải từ savani.vn (có logo SAVANI) → chỉ hợp làm ảnh cửa hàng; nên ghi nguồn trong báo cáo, thay ảnh tự chụp nếu repo công khai.
- **Cần xin người dùng:** ảnh **toàn thân áo, chụp chính diện** (ảnh chính trên trang sản phẩm, tên file không có `__2__`) để phòng thử dùng ảnh thật.

## 4. Đang chờ người dùng quyết định ⏳
Người dùng thấy phòng thử AR hiện tại "lỏ" (giống dán sticker), muốn giống **Anywear** (AI mặc áo lên video camera trực tiếp). Hai hướng đã trình bày:

**A. Tích hợp Decart (trả phí, giống hệt video mẫu)**
- Mô hình **Lucy VTON 3.6** (`lucy-vton-latest`), video thời gian thực qua WebRTC. SDK JS `@decartai/sdk`, có ví dụ Next.js: github.com/DecartAI/tryon-examples. Server tạo token ngắn hạn từ API key (key để trong `.env.local`, người dùng tự dán).
- Giá (docs.platform.decart.ai/getting-started/pricing): realtime 720p **$0.02/giây** (~520đ, ~31.000đ/phút); chế độ nhanh $0.04/giây (gấp đôi, không cần). Lucy 2.5 cùng giá. $1 = 100 credit, không gói tháng; tài khoản mới **được tặng credit** (không rõ bao nhiêu).
- Đã hứa cài "phanh": tự tắt sau 30 giây/lượt, ngắt khi ẩn tab/rời trang, hiện credit còn lại (`GET /v1/credits`), chỉ dùng chế độ thường, hết credit thì quay về AR miễn phí. Cập nhật thông báo quyền riêng tư (video gửi lên máy chủ Decart).

**B. Nâng cấp AR miễn phí (tự làm, chạy trên máy)**
- Uốn áo theo lưới (mesh warp, WebGL) theo vai/eo/khuỷu.
- Che áo bằng tay/cánh tay (MediaPipe Image Segmenter).
- Khớp ánh sáng camera, bóng, viền mềm.
- Dùng ảnh áo thật đã tách nền.
- Tuỳ chọn: nút "Tạo ảnh AI" qua Hugging Face Space **IDM-VTON** (miễn phí, ảnh tĩnh, 20–60 giây).

Ghi chú: không có mô hình mã nguồn mở nào làm thử đồ video thời gian thực trên máy cá nhân (máy người dùng: RTX 4050 6GB, RAM 15GB) → không thể tự dựng lại Decart.

## 5. Việc tiếp theo (theo thứ tự)
1. Hỏi người dùng chọn **A (Decart)** hay **B (nâng cấp AR)** — hoặc cả hai (Decart chính, AR dự phòng).
2. Xin ảnh toàn thân áo chính diện.
3. Người dùng tự test phòng thử với camera thật, báo lại kết quả.
4. Sau đó: trang quản trị (admin) — PLAN.md Giai đoạn 7.
