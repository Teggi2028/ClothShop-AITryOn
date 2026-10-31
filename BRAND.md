# BRAND — Quy chuẩn phong cách website

> **Trạng thái:** v0.2 (31/10/2026). Đã chốt phong cách **sang trọng**, đối tượng dùng **laptop**.
> Tên thương hiệu **AURA Atelier** là tên tạm — đổi ở một chỗ duy nhất: `src/lib/brand.ts`.
> **Nguyên tắc vàng:** mọi màu, font, khoảng cách trong code **phải lấy từ token** (khai báo ở `src/app/globals.css`) — không gõ mã màu lẻ (`#123456`) rải rác trong component.

---

## 1. Tinh thần thương hiệu

- **Tên (tạm):** AURA Atelier
- **Câu định vị:** *"Mặc thử trước — chọn lựa tinh tế."*
- **Ba từ khoá:** **Sang trọng** · **Tối giản** · **Tinh tế công nghệ**
  - Sang trọng: tông đen – trắng ngà – vàng champagne, chữ tiêu đề có chân (serif), nhiều khoảng trắng.
  - Tối giản: sản phẩm là nhân vật chính, không banner nhấp nháy.
  - Tinh tế công nghệ: tính năng thử đồ bằng camera được giới thiệu như một "dịch vụ phòng thử riêng", không phô trương kiểu neon/sci-fi.

### Nên / Không nên
| ✅ Nên | ❌ Không nên |
|---|---|
| Khoảng trắng rộng, lưới thoáng | Nhồi nhiều khối, chữ chạy, pop-up |
| Vàng champagne dùng **tiết chế** (đường kẻ, nhãn, nút "Thử ngay") | Phủ vàng lên mảng lớn, gradient vàng bóng loáng |
| Tiêu đề serif, chữ nhỏ viết HOA giãn rộng cho nhãn | Viết HOA cả câu dài, dấu "!!!" |
| Bo góc rất nhỏ hoặc vuông | Bo tròn mềm kiểu app vui nhộn |

---

## 2. Màu sắc (Color tokens)

> **Token** = một cái tên đặt cho giá trị thiết kế (vd `--color-gold`). Muốn đổi màu cả web chỉ cần sửa 1 chỗ.

| Token (Tailwind) | Mã màu | Dùng cho |
|---|---|---|
| `ivory` | `#F6F3EE` | Nền trang |
| `pearl` | `#FBFAF7` | Nền thẻ, ô nhập, hộp thoại |
| `sand` | `#ECE6DC` | Nền ảnh sản phẩm, khối phụ |
| `noir` | `#121212` | Chữ chính, nút chính, nền các khối "đêm" (hero, footer) |
| `stone` | `#6E6A64` | Chữ phụ, mô tả |
| `line` | `#E1DACE` | Viền, đường kẻ |
| `gold` | `#B08D57` | **Vàng champagne** — nền nút "Thử ngay" (chữ `noir`), đường kẻ trang trí, chữ vàng trên nền `noir` |
| `gold-deep` | `#7A5C2E` | Chữ vàng trên nền sáng (liên kết, giá khuyến mãi) |
| `gold-soft` | `#EFE6D6` | Nền nhạt của nhãn |
| `success` | `#2F6B4F` | Thành công |
| `danger` | `#A8322D` | Lỗi |

### Quy tắc
- Tỉ lệ gần đúng: **60%** ivory/pearl · **30%** noir · **10%** gold.
- Độ tương phản chữ ≥ **4.5 : 1** (chuẩn WCAG AA). Lưu ý: **không** dùng chữ `gold` trên nền sáng (không đủ tương phản) → dùng `gold-deep`.
- Không làm chế độ tối (dark mode) cho cả trang; thay vào đó dùng các **khối nền noir** xen kẽ để tạo nhịp sang trọng.
- Phòng thử: nền `noir`, nút trên video đặt trên lớp mờ `noir/60`.

---

## 3. Chữ (Typography)

| Vai trò | Font | Ghi chú |
|---|---|---|
| Tiêu đề (display, h1–h3, giá lớn) | **Cormorant Garamond** 500/600 | Serif thanh lịch, có hỗ trợ tiếng Việt |
| Nội dung, nút, nhãn | **Be Vietnam Pro** 300/400/500 | Thiết kế cho tiếng Việt |

| Token | Cỡ / Dòng | Dùng cho |
|---|---|---|
| `display` | 64 / 68px | Tiêu đề hero |
| `h1` | 44 / 52px | Tiêu đề trang |
| `h2` | 32 / 40px | Tiêu đề khối |
| `h3` | 22 / 30px | Tên sản phẩm (trang chi tiết) |
| `body` | 15 / 26px | Nội dung |
| `small` | 13 / 20px | Tên trên thẻ sản phẩm, chú thích |
| `eyebrow` | 11 / 16px, HOA, giãn chữ 0.24em | Nhãn nhỏ phía trên tiêu đề ("BỘ SƯU TẬP THU ĐÔNG") |

- Giá tiền: `1.890.000 ₫` (dùng `Intl.NumberFormat('vi-VN')`), font serif; giá cũ màu `stone` + gạch ngang.

---

## 4. Khoảng cách, bo góc, đổ bóng
- **Khoảng cách bội số 4px:** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`
- **Lề hai bên:** 24px (≤ 1024px) · 48px (màn laptop). Nội dung rộng tối đa **1360px**.
- **Bo góc:** `2px` cho nút/ô nhập/thẻ (gần như vuông — cảm giác may đo), `full` chỉ cho nút chụp ảnh và chấm màu.
- **Đổ bóng:** gần như không dùng. Phân tách bằng **đường kẻ mảnh 1px `line`** và khoảng trắng.

## 5. Màn hình
Khách chủ yếu dùng **laptop (1280–1920px)** → thiết kế ưu tiên desktop, vẫn co giãn được xuống tablet/điện thoại.
| Từ chiều rộng | Lưới sản phẩm |
|---|---|
| 0 | 2 cột |
| 768px | 3 cột |
| 1280px | 4 cột |

---

## 6. Thành phần giao diện (Components)

### Nút (Button) — cao 48px, chữ 12px HOA giãn 0.18em, bo 2px
| Loại | Kiểu | Dùng khi |
|---|---|---|
| **Primary** | Nền `noir`, chữ `ivory` | Thêm vào giỏ, Đặt hàng |
| **Gold** | Nền `gold`, chữ `noir`, icon camera | **Chỉ cho "Thử ngay" / "Vào phòng thử"** |
| **Outline** | Viền `noir`, nền trong suốt | Hành động phụ |
| **Link** | Chữ gạch chân mảnh | Liên kết trong đoạn văn |
- Hover: Primary → nền `gold` chữ `noir`; Outline → nền `noir` chữ `ivory`. Chuyển 300ms.
- Focus: viền 2px `gold`. Disabled: mờ 40%.

### Thẻ sản phẩm (ProductCard)
- Ảnh tỉ lệ **4:5** trên nền `sand`; hover ảnh phóng nhẹ 1.03.
- Dưới ảnh: tên (small), giá (serif), các chấm màu.
- Nhãn góc trên: "MỚI" (nền `pearl`), và nếu thử được: icon camera nhỏ màu `gold-deep`.

### Nhãn (Badge)
`eyebrow`, nền `pearl` hoặc `gold-soft`, viền mảnh, không bo.

### Ô nhập (Input)
Cao 48px, chỉ có **đường kẻ dưới** `line`; focus kẻ dưới `noir`; lỗi kẻ `danger` + dòng chữ báo lỗi.

### Icon
Bộ **Lucide** (`lucide-react`), nét 1.25–1.5px, cỡ 18–20px.

---

## 7. Phòng thử đồ (Try-On Studio)
- Bố cục laptop: **khung camera bên trái (~65%)**, **bảng điều khiển bên phải** (sản phẩm, màu, size, tinh chỉnh vừa người, chụp, thêm vào giỏ).
- Nền phòng thử `noir`, chữ `ivory`, điểm nhấn `gold` → cảm giác "phòng thử riêng".
- Khi chưa nhận ra người: khung viền nét đứt hình bán thân + chỉ dẫn "Ngồi thẳng, lùi lại để thấy rõ hai vai".
- Nút chụp tròn 64px viền `gold`. Ảnh đã chụp hiện thành dải thumbnail, bấm để tải về.
- **Thông báo quyền riêng tư** trước khi bật camera: "Hình ảnh chỉ được xử lý ngay trên máy của bạn và không được gửi đi đâu."
- Lỗi không có quyền camera: hướng dẫn bật lại + phương án **"Tải ảnh lên"**.

## 8. Hình ảnh
- Hiện dùng **hình minh hoạ SVG** (sinh tự động bằng `npm run garments`) thay cho ảnh thật.
- Khi có ảnh thật: nền trơn `#ECE6DC` hoặc trắng, ánh sáng mềm, cùng góc chụp; ảnh dùng để thử phải là **PNG nền trong suốt** tách riêng *thân áo* và *tay áo* (xem PLAN.md mục 4.3).

## 9. Chuyển động
- 300ms, easing `cubic-bezier(0.2, 0, 0, 1)`; chỉ fade/trượt nhẹ, không nảy (bounce).
- Tôn trọng `prefers-reduced-motion`.

## 10. Giọng văn
- Xưng **"bạn"**, lịch sự, ngắn gọn, hơi trang trọng.
- Nút: "Thử ngay", "Thêm vào giỏ", "Hoàn tất đặt hàng".
- Lỗi: nói rõ chuyện gì + cách sửa: "Chưa bật được camera. Bạn hãy cho phép trình duyệt dùng camera rồi thử lại."

## 11. Logo
- Tạm dùng **logo chữ**: `AURA` (Cormorant Garamond 600, giãn chữ 0.3em) + `ATELIER` (Be Vietnam Pro 10px, giãn 0.5em) bên dưới.
