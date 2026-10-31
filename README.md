# AURA Atelier — Website thời trang cao cấp có phòng thử bằng camera

Đồ án: website bán áo, trong đó khách có thể **bật webcam trên laptop và thấy mình "mặc" chiếc áo** ngay trên màn hình.
Nhận diện dáng người chạy **ngay trên trình duyệt** (MediaPipe Pose), không gửi hình ảnh đi đâu và hoàn toàn miễn phí.

- Kế hoạch & lộ trình: [PLAN.md](PLAN.md)
- Quy chuẩn giao diện / thương hiệu: [BRAND.md](BRAND.md)

## Chạy dự án trên máy

Yêu cầu: **Node.js 20 trở lên** (kiểm tra bằng `node -v`).

```bash
npm install          # tải thư viện (chỉ cần chạy lần đầu)
npm run db:setup     # tạo database SQLite + đổ 10 sản phẩm mẫu
npm run dev          # chạy website ở chế độ phát triển
```

Mở **http://localhost:3000**. Phòng thử nằm ở **http://localhost:3000/try-on**.

> Camera chỉ hoạt động trên `localhost` hoặc trang `https://`. Lần đầu vào phòng thử, trình duyệt sẽ hỏi quyền camera, bạn bấm **Cho phép**.
> Phòng thử cần mạng internet để tải mô hình nhận diện (~5MB) ở lần đầu.

## Các lệnh hay dùng

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy website, tự cập nhật khi sửa code |
| `npm run build` rồi `npm start` | Build và chạy bản tối ưu (production) |
| `npm run lint` | Kiểm tra lỗi / quy tắc viết code |
| `npm run garments` | Vẽ lại hình áo SVG từ `src/data/catalog.ts` |
| `npm run db:seed` | Xoá & tạo lại sản phẩm mẫu (đơn hàng giữ nguyên) |
| `npm run db:studio` | Mở giao diện xem/sửa database trên trình duyệt |

## Cấu trúc thư mục

```
prisma/
  schema.prisma          cấu trúc database (Product, ProductColor, Order...)
  seed.ts                đổ dữ liệu mẫu
scripts/
  generate-garments.ts   vẽ hình minh hoạ áo (thay bằng ảnh thật sau)
public/garments/         ảnh áo: ảnh hiển thị + ảnh thân/tay áo nền trong suốt để thử
src/
  app/                   các trang (Next.js App Router)
    page.tsx             trang chủ
    shop/                danh sách sản phẩm (lọc, sắp xếp)
    product/[slug]/      chi tiết sản phẩm
    try-on/              phòng thử
    cart/, checkout/     giỏ hàng, đặt hàng (Server Action lưu đơn)
    order/[code]/        trang đặt hàng thành công
  components/            Header, Footer, ProductCard...
  data/catalog.ts        danh sách sản phẩm mẫu
  features/try-on/       ★ toàn bộ logic thử đồ
    pose-detector.ts     khởi tạo MediaPipe
    garment-geometry.ts  quy ước điểm neo vai trên ảnh áo
    garment-renderer.ts  toán học: vai/khuỷu/cổ tay → vị trí, tỉ lệ, góc xoay → vẽ
    TryOnStudio.tsx      giao diện phòng thử + vòng lặp camera
  lib/                   database, định dạng tiền, thông tin thương hiệu
  stores/cart.ts         giỏ hàng (Zustand + localStorage)
```

## Phòng thử hoạt động thế nào?

1. `getUserMedia` mở webcam → video.
2. Mỗi khung hình, **MediaPipe Pose Landmarker** trả về 33 điểm trên cơ thể; ta dùng vai, khuỷu tay, cổ tay và hông.
3. Tính **tỉ lệ** (bề rộng vai người ÷ bề rộng vai trên ảnh áo), **góc nghiêng** (`atan2` giữa hai vai) và **vị trí** (trung điểm hai vai).
4. Làm mượt bằng trung bình trượt mũ (EMA) để áo không rung.
5. Vẽ lên `<canvas>`: video (lật gương) → tay áo dọc theo cánh tay → thân áo.
6. Nút chụp: `canvas.toBlob()` → tải ảnh về máy.

## Thay ảnh minh hoạ bằng ảnh thật

Mỗi màu áo cần 4 ảnh (đặt trong `public/garments/`, đúng tên như hiện tại):
- Ảnh hiển thị trong cửa hàng (nền bất kỳ).
- **Thân áo** PNG nền trong suốt, khung 400×400, hai điểm vai nằm ở toạ độ (112, 78) và (288, 78).
- **Tay áo trên / dưới** PNG nền trong suốt, khung 100×300, dựng đứng (vai ở trên, khuỷu/cổ tay ở dưới).

Xem chi tiết trong `src/features/try-on/garment-geometry.ts`.
