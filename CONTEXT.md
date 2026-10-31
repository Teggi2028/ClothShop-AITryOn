# CONTEXT — Ghi chú để làm tiếp ở phiên sau

> Cập nhật: 31/10/2026. Đọc file này đầu tiên khi bắt đầu phiên làm việc mới.
> Tài liệu liên quan: [PLAN.md](PLAN.md) (lộ trình), [BRAND.md](BRAND.md) (giao diện), [README.md](README.md) (cách chạy).

## 1. Người dùng & cách làm việc
- Người mới dùng Linux Mint, nói tiếng Việt → giải thích ngắn gọn, dễ hiểu, giải thích lệnh trước khi chạy.
- Dự án là **đồ án** (không kinh doanh thật). Người dùng nhờ **viết code trực tiếp**.
- **Quy ước commit:** commit đứng tên người dùng (`Teggi2028`), **không** thêm dòng `Co-Authored-By` hay "Generated with ..." vào commit/PR.
- GitHub: repo riêng tư **Teggi2028/ClothShop-AITryOn**, nhánh `main`.

## 2. Dự án hiện có gì
**AURA Fashion** (tên tạm, đổi ở `src/lib/brand.ts`) — web bán **áo nam**, có phòng thử đồ bằng AI.

| Phần | Trạng thái |
|---|---|
| Giao diện | Phong cách bán lẻ giống bố cục **savani.vn** (nền trắng, giá đỏ, voucher, bộ lọc trái, font Mulish). Không dùng tên/logo Savani. |
| Trang | Trang chủ · Cửa hàng (lọc danh mục/màu/giá, sắp xếp, tìm kiếm không dấu) · Chi tiết · Giỏ hàng · Đặt hàng COD · Đặt hàng thành công · 404 |
| Mã giảm giá | `AURA30K/50K/100K/200K` (`src/lib/vouchers.ts`), kiểm tra cả ở trình duyệt và server |
| Dữ liệu | 226 mẫu áo thật từ savani.vn (`src/data/products.json`, ảnh trong `public/products/savani/` — xem mục 3) |
| Phòng thử | `/try-on` — **AI tạo ảnh** (đổi ngày 31/10/2026, bỏ AR/MediaPipe): chụp webcam (đếm ngược 3s, khung 3:4) hoặc tải ảnh → `POST /api/try-on` → server (`src/features/try-on/virtual-try-on.ts`) dùng `sharp` chuẩn bị ảnh rồi gọi Hugging Face Space **`yisol/IDM-VTON`** qua `@gradio/client` → trả JPEG. So sánh ảnh gốc/ảnh AI, tải về, giữ 8 ảnh trong phiên. Không lưu ảnh trên server. |
| Kiểm tra | `npm run lint` + `npm run build` đều qua. Luồng đặt hàng + voucher đã test. Phòng thử AI đã test bằng ảnh mẫu (tải ảnh lên → ảnh AI ~20–30 giây). **Nút chụp webcam chưa test với camera thật** (trình duyệt của trợ lý bị chặn camera). |

**Công nghệ:** Next.js 16.4 (App Router, `cacheComponents` bật → hàm đọc DB dùng `"use cache"` + `cacheTag("products")`, trang dùng `searchParams`/`params` có `loading.tsx`), React 19, Tailwind 4 (token trong `src/app/globals.css`), Prisma **6.19** + SQLite (`prisma/dev.db`, không commit), Zustand (giỏ hàng localStorage), Zod 4, lucide-react.

**Chạy:** `npm install` → `npm run db:setup` → `npm run dev` → http://localhost:3000
Cập nhật sản phẩm: `npm run import:savani && npm run db:seed`.

## 3. Ảnh sản phẩm
- 6 ảnh người dùng đưa vào `Cloth/` (được `.gitignore`), đã chép sang `public/products/`.
- Đây là **ảnh cận cổ áo** tải từ savani.vn (có logo SAVANI) → chỉ hợp làm ảnh cửa hàng; nên ghi nguồn trong báo cáo, thay ảnh tự chụp nếu repo công khai.
- **31/10: đã tải 624 ảnh toàn thân áo** từ savani.vn/collections/nam vào `Cloth/savani-ao-nam/<loai-ao>/` (226 mẫu áo, mỗi màu 1 ảnh, 800×1038 nền trắng). `danh-sach.csv` ghi nguồn; `savani-products.json` = dữ liệu gốc (giá, size, màu, tag).
  Cách chọn ảnh: ảnh đại diện của từng biến thể màu (`variants[].image_id`). KHÔNG dựa vào tên file `__1__` hay thứ tự ảnh (~50% là ảnh chi tiết).
- **ĐÃ ÁP DỤNG (31/10):** cửa hàng dùng 226 mẫu áo Savani thay 16 sản phẩm giả lập. `npm run import:savani` (scripts/import-savani.ts) → `src/data/products.json` (commit) + `public/products/savani/` (gitignore) → `npm run db:seed`.
  610 màu; bỏ 36 màu không có ảnh + 14 màu mà ảnh là người mẫu/áo treo (lọc tự động bằng điểm viền ảnh, ngưỡng 50). Mô tả tự ghép từ kiểu dáng + chất liệu (không chép văn của Savani). Trang chi tiết có dòng ghi nguồn savani.vn.
  Danh mục: so-mi, polo, thun, **ao-ni** (đổi từ ao-len), ao-khoac. Bộ lọc màu theo **họ màu** (`ProductColor.family`, `COLOR_FAMILIES`). Trang cửa hàng chia trang 24 SP. Phòng thử có nút lọc danh mục.
  Đã xoá: script vẽ SVG, `public/garments/`, 6 ảnh cận cổ cũ, cột AR trong DB (garmentStyle, fitWidth/OffsetY, photo, torso/sleeve assets). Thêm cột `family`, `Product.source`.
  Người dùng đồng ý: ảnh chỉ dùng cho đồ án, không đưa web công khai.
- (đã xong nhờ ảnh Savani) ~~Cần xin ảnh **toàn thân áo, chụp chính diện**~~ (ảnh chính trên trang sản phẩm, tên file không có `__2__`) để phòng thử dùng ảnh thật.

## 4. Phòng thử AI — ghi chú kỹ thuật
- Lịch sử: AR 2D (MediaPipe, "giống dán sticker") → người dùng chọn **ảnh tĩnh do AI tạo** thay vì video. Đã cân nhắc Decart (video realtime, trả phí ~$0.02/giây) — không dùng.
- IDM-VTON chạy trên **ZeroGPU miễn phí** của Hugging Face: có hàng chờ + **hạn mức GPU theo ngày**. Không token vẫn chạy (đã test). Thêm `HF_TOKEN` (token Read) vào `.env.local` để có hạn mức riêng — mẫu ở `.env.example`.
- Giấy phép IDM-VTON: CC BY-NC-SA 4.0 (phi thương mại) → ổn cho đồ án, ghi trong báo cáo.
- Tham số gửi đi: `is_checked` (tự khoanh vùng áo) = true, `is_checked_crop` = true, 30 bước, seed 42; mô tả áo tiếng Anh theo danh mục (`GARMENT_DESCRIPTIONS`).
- **Lỗi đã gặp (31/10):** người dùng chụp webcam quá gần (chỉ thấy mặt + cổ) → AI trả áo TRẮNG dù chọn áo đen. Ảnh áo gửi đi vẫn đúng màu đen (đã kiểm tra) → nguyên nhân: mô hình không thấy thân/hông nên khoanh sai vùng áo.
  Cách xử lý: `src/features/try-on/photo-check.ts` (MediaPipe Pose trên trình duyệt) kiểm tra ảnh phải thấy rõ **hai vai** và **vị trí hông nằm trong khung** (y ≤ 1; không xét độ tin cậy của hông vì áo rộng che hông → chỉ ~0.4 dù hông vẫn trong ảnh — đo trên ảnh thật của người dùng), nếu không thì khoá nút "Mặc thử" và hướng dẫn chụp lại (có nút "Vẫn thử"). Khi bật camera: khung dáng người + lời nhắc trực tiếp ~3 lần/giây, đếm ngược 5 giây.
  Tiết kiệm lượt: bấm lại đúng ảnh + áo + màu đã tạo thì dùng lại ảnh cũ; lỗi hết lượt báo giờ mở lại ("thử lại sau khoảng X giờ Y phút").
  Đã test: ảnh của người dùng → bị chặn "Chưa thấy hông"; ảnh người mẫu → qua. Chưa chạy lại AI để xác nhận màu (hết lượt GPU).
- **Hạn mức:** không đăng nhập thì mỗi máy chỉ được vài lượt/ngày (đã gặp "exceeded your ZeroGPU quota… Try again in 23:46"). Tài khoản free có ~5 phút GPU/ngày, mỗi lượt IDM-VTON giữ 60 giây → ~3–5 lượt/ngày. PRO: 40 phút/ngày.
- Space **Kolors Virtual Try-On** tắt API (`api_open=False`, `show_api=False`) → KHÔNG dùng.
- Ảnh áo gửi cho AI = hình minh hoạ SVG (`color.image`) đã đổi sang JPEG nền trắng 768×1024. Ảnh thật hiện chỉ là cận cổ áo.
- Còn sót từ AR: cột `fitWidth`/`fitOffsetY` và các file `*-torso/-sleeve-*.svg` (bộ sinh hình vẫn tạo) — không còn dùng ở phòng thử, có thể dọn sau.
- Phương án dự phòng nếu Space hỏng/hết lượt: đổi sang Space khác (Kolors Virtual Try-On, CatVTON) hoặc API trả phí — chỉ cần sửa `virtual-try-on.ts`.

## 5. Việc tiếp theo (theo thứ tự)
1. **Người dùng đã chọn (31/10): giữ IDM-VTON miễn phí + HF_TOKEN** (không dùng API trả phí, không chạy trên máy). Người dùng tự tạo token Read và dán vào `.env.local`.
1b. Người dùng xác nhận lúc chụp lỗi đang mặc áo trắng → AI không thay được áo (đúng giả thuyết khung hình). Test lại camera: đứng xa ~1,5 m, khung dáng người chuyển xanh rồi chụp.
2. Xin ảnh **toàn thân áo, chính diện, nền trắng** → dùng làm ảnh gửi cho AI (kết quả giống áo thật hơn hình minh hoạ).
3. (Tuỳ chọn) Người dùng tạo `HF_TOKEN` nếu hay gặp lỗi hết lượt.
4. Sau đó: trang quản trị (admin) — PLAN.md Giai đoạn 7.
