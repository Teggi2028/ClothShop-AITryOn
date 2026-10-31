# BRAND — Quy chuẩn phong cách website

> **Trạng thái:** v0.3 (31/10/2026). Chuyển từ phong cách "sang trọng" sang **phong cách bán lẻ thời trang nam hiện đại** (tham khảo bố cục các trang như savani.vn: nền trắng, giá đỏ, voucher, bộ lọc bên trái).
> Tên thương hiệu **AURA Fashion** (tạm) — đổi ở `src/lib/brand.ts`. Không dùng tên, logo hay nội dung của thương hiệu khác.
> **Nguyên tắc vàng:** mọi màu, font, khoảng cách lấy từ token trong `src/app/globals.css`, không gõ mã màu lẻ trong component.

---

## 1. Tinh thần
- **Rõ ràng – nhanh – nhiều ưu đãi:** khách nhìn là thấy giá, giảm bao nhiêu, có mã gì.
- **Sản phẩm là trung tâm:** ảnh lớn nền xám nhạt, lưới 4 cột.
- **Điểm khác biệt:** nút **"Thử ngay bằng camera"** màu xanh dương, xuất hiện ở thẻ sản phẩm, trang chi tiết và header.

## 2. Màu sắc (Tailwind token)
| Token | Mã màu | Dùng cho |
|---|---|---|
| `white` | `#FFFFFF` | Nền trang |
| `surface` | `#F5F5F5` | Nền ảnh sản phẩm, breadcrumb, footer |
| `ink` | `#111111` | Chữ chính, nút "Thêm vào giỏ" |
| `muted` | `#666666` | Chữ phụ, giá gốc gạch ngang |
| `subtle` | `#999999` | Chú thích, nhãn thương hiệu trên thẻ |
| `line` | `#E5E5E5` | Viền, đường kẻ |
| `sale` | `#C91C1F` | **Giá bán**, nhãn "-20%", "Hàng mới về", mã voucher |
| `accent` | `#1F6FC5` | Tính năng **phòng thử**, liên kết |
| `topbar` | `#1F7AC2` | Thanh thông báo trên cùng |
| `promo` | `#FFD200` | Khối vàng của thẻ voucher, điểm nhấn banner |
| `success` | `#2F8A4C` | Thông báo thành công |

Quy tắc: đỏ chỉ dành cho **giá & khuyến mãi**; xanh chỉ dành cho **phòng thử & liên kết**; nút mua hàng màu đen.

## 3. Chữ
- Font duy nhất: **Mulish** (Google Fonts, có tiếng Việt), độ đậm 400–800.
- Cỡ chữ: nội dung 14px · tên sản phẩm 15px · tiêu đề khối 24px đậm (thường VIẾT HOA) · giá trang chi tiết 24px đậm 800.
- Giá: `440.000₫` màu `sale`, đậm; giá gốc `muted` gạch ngang + nhãn `-20%`.

## 4. Khoảng cách & hình khối
- Nội dung rộng tối đa **1240px**, lề 16px (mobile) / 24px (laptop).
- Bo góc: 4px (nút, ô nhập), 6–8px (thẻ, banner), tròn hẳn cho chấm màu, ô tìm kiếm và ảnh danh mục.
- Đổ bóng nhẹ chỉ dùng cho thẻ voucher.

## 5. Thành phần
| Thành phần | Mô tả |
|---|---|
| **Thanh trên cùng** | Nền `topbar`, chữ trắng in hoa: miễn phí ship, mã giảm giá, phòng thử |
| **Header** | Logo trái · menu danh mục · "Phòng thử" (xanh) · ô tìm kiếm bo tròn · giỏ hàng có số đỏ |
| **Breadcrumb** | Thanh nền `surface` bo góc |
| **Thẻ voucher** | Khối vàng có icon vé + "NHẬP MÃ: AURA30K" đỏ + nút "Sao chép" đỏ |
| **Thẻ sản phẩm** | Ảnh tỉ lệ 37:48 nền `surface` · nhãn "🔥 Hàng mới về" đỏ · "Thử được" xanh · tên thương hiệu nhỏ · tên · giá đỏ · giá gốc + `-x%` · chấm màu |
| **Cửa hàng** | Cột lọc trái (Danh mục, Màu sắc, Khoảng giá) · ô "Sắp xếp" phải |
| **Chi tiết** | Ảnh nhỏ dọc bên trái + ảnh lớn · tên, mã SP · giá đỏ + tiết kiệm · khung khuyến mãi viền đỏ đứt nét · chọn màu (ảnh tròn) · chọn size · nút đen "Thêm vào giỏ" + nút xanh "Thử ngay" |
| **Nút** | Cao 44px, chữ đậm 14px: `btn-primary` (đen), `btn-accent` (xanh), `btn-outline` |

## 6. Phòng thử
- Khung camera nền đen bên trái; bảng điều khiển **nền trắng** bên phải (chọn mẫu, màu, size, tinh chỉnh, ảnh đã chụp).
- Nút "Bật camera" màu `accent`; dòng quyền riêng tư luôn hiển thị trước khi bật camera.

## 7. Hình ảnh
- Ảnh chụp thật: `public/products/`, tỉ lệ 370×480, nền xám nhạt.
- Màu chưa có ảnh thật → dùng hình minh hoạ SVG (`npm run garments`).
- Ảnh dùng để **thử đồ** cần áo chụp **toàn thân áo, chính diện**, tách nền trong suốt (xem PLAN.md mục 4.3).

## 8. Giọng văn
- Xưng "bạn", ngắn gọn, thân thiện; nhấn mạnh ưu đãi bằng chữ in hoa ngắn ("HÀNG MỚI VỀ", "NHẬP MÃ").
- Lỗi luôn nói rõ cách sửa: "Mã AURA200K áp dụng cho đơn từ 2.000.000₫".
