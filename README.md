# AURA Fashion — Website thời trang nam có phòng thử đồ bằng AI

Đồ án: website bán áo, trong đó khách **chụp ảnh bằng webcam (hoặc tải ảnh lên), chọn áo, và AI tạo ảnh khách đang mặc chiếc áo đó**.
AI là mô hình **IDM-VTON** chạy miễn phí trên Hugging Face Space (`yisol/IDM-VTON`).

- Kế hoạch & lộ trình: [PLAN.md](PLAN.md)
- Quy chuẩn giao diện / thương hiệu: [BRAND.md](BRAND.md)

## Chạy dự án trên máy

Yêu cầu: **Node.js 20 trở lên** (kiểm tra bằng `node -v`).

```bash
npm install            # tải thư viện (chỉ cần chạy lần đầu)
npm run import:savani  # chép ảnh áo từ Cloth/savani-ao-nam vào public/ + tạo src/data/products.json
npm run db:setup       # tạo database SQLite + đổ 226 mẫu áo
npm run dev            # chạy website ở chế độ phát triển
```

> **Ảnh sản phẩm** lấy từ savani.vn (bản quyền Savani, chỉ dùng cho đồ án) nên **không có trên GitHub**:
> thư mục `Cloth/` và `public/products/savani/` nằm trong `.gitignore`. Máy khác muốn chạy cần chép thư mục
> `Cloth/savani-ao-nam/` sang rồi chạy `npm run import:savani`.

Mở **http://localhost:3000**. Phòng thử nằm ở **http://localhost:3000/try-on**.

> Camera chỉ hoạt động trên `localhost` hoặc trang `https://`. Lần đầu bấm "Chụp bằng camera", trình duyệt sẽ hỏi quyền camera, bạn bấm **Cho phép**.
> Phòng thử cần mạng internet: server gửi ảnh tới Hugging Face, mỗi lượt mất khoảng 20–60 giây.

**Tuỳ chọn — token Hugging Face:** không có token vẫn chạy được, nhưng GPU miễn phí dùng chung nên hay hết lượt.
Tạo token loại *Read* ở https://huggingface.co/settings/tokens, rồi:

```bash
cp .env.example .env.local   # tạo file cấu hình riêng (không đưa lên GitHub)
```

Mở `.env.local`, dán token vào dòng `HF_TOKEN=`, sau đó tắt và chạy lại `npm run dev`.

## Các lệnh hay dùng

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy website, tự cập nhật khi sửa code |
| `npm run build` rồi `npm start` | Build và chạy bản tối ưu (production) |
| `npm run lint` | Kiểm tra lỗi / quy tắc viết code |
| `npm run import:savani` | Tạo lại dữ liệu + ảnh sản phẩm từ `Cloth/savani-ao-nam/` |
| `npm run db:seed` | Xoá & tạo lại sản phẩm từ `src/data/products.json` (đơn hàng giữ nguyên) |
| `npm run db:studio` | Mở giao diện xem/sửa database trên trình duyệt |

## Cấu trúc thư mục

```
prisma/
  schema.prisma          cấu trúc database (Product, ProductColor, Order...)
  seed.ts                đổ dữ liệu mẫu
scripts/
  import-savani.ts       dữ liệu áo savani.vn → products.json + ảnh trong public/products/savani/
Cloth/savani-ao-nam/     (không lên GitHub) ảnh gốc + savani-products.json + danh-sach.csv (ghi nguồn)
public/products/savani/  (không lên GitHub) ảnh sản phẩm dùng trên web và cho phòng thử AI
src/
  app/                   các trang (Next.js App Router)
    page.tsx             trang chủ
    shop/                danh sách sản phẩm (lọc, sắp xếp)
    product/[slug]/      chi tiết sản phẩm
    try-on/              phòng thử
    api/try-on/          API nhận ảnh, trả về ảnh AI (JPEG)
    cart/, checkout/     giỏ hàng, đặt hàng (Server Action lưu đơn)
    order/[code]/        trang đặt hàng thành công
  components/            Header, Footer, ProductCard...
  data/catalog.ts        danh mục, họ màu, kiểu dữ liệu sản phẩm
  data/products.json     226 mẫu áo (do import-savani.ts tạo)
  features/try-on/       ★ toàn bộ logic thử đồ
    TryOnStudio.tsx      giao diện phòng thử: camera/tải ảnh → gửi lên server → hiện ảnh AI
    virtual-try-on.ts    (server) chuẩn bị ảnh bằng sharp + gọi IDM-VTON qua @gradio/client
  lib/                   database, định dạng tiền, thông tin thương hiệu
  stores/cart.ts         giỏ hàng (Zustand + localStorage)
```

## Phòng thử hoạt động thế nào?

1. **Trình duyệt:** `getUserMedia` mở webcam → đếm ngược 3 giây → cắt khung 3:4 ở giữa → `canvas.toBlob()` ra JPEG. Hoặc khách chọn ảnh có sẵn.
2. Bấm **Mặc thử** → gửi `FormData` (ảnh + mã áo + mã màu) tới `POST /api/try-on`.
3. **Server** (`virtual-try-on.ts`):
   - Tìm áo trong database (không tin đường dẫn ảnh do trình duyệt gửi).
   - Dùng `sharp`: xoay ảnh đúng chiều, thu nhỏ, **xoá EXIF** (vị trí GPS…); đổi hình áo SVG thành JPEG nền trắng 768×1024.
   - Gọi Space `yisol/IDM-VTON` (endpoint `/tryon`) qua `@gradio/client`, kèm mô tả áo tiếng Anh theo danh mục.
   - Tải ảnh kết quả về, nén JPEG rồi trả cho trình duyệt. Ảnh không được lưu lại trên server.
4. Trình duyệt hiện ảnh AI, cho so sánh với ảnh gốc, tải về, và giữ tối đa 8 ảnh trong phiên.

**Giới hạn:** GPU miễn phí dùng chung (ZeroGPU) → có hàng chờ và hạn mức mỗi ngày; giấy phép mô hình IDM-VTON là
CC BY-NC-SA 4.0 (chỉ dùng phi thương mại — hợp với đồ án).

## Ảnh áo dùng cho AI

Mỗi màu áo có 1 **ảnh toàn thân áo, chụp chính diện, nền trắng** (ảnh đại diện của màu đó trên savani.vn).
Cửa hàng và phòng thử AI dùng chung ảnh này (`ProductColor.image`).

`import-savani.ts` tự loại các màu mà ảnh đại diện là ảnh người mẫu / áo treo móc (đo độ "trơn" của nền ở viền ảnh),
vì AI cần ảnh chỉ có cái áo. Màu chủ đạo (ô màu) cũng được đo từ vùng giữa ảnh.
