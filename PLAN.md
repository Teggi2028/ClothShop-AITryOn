# PLAN — Website bán quần áo + Thử đồ bằng camera (AI Try-On)

> **Cập nhật 31/10/2026:** phòng thử đã chuyển từ Cách A (AR 2D) sang **Cách B — AI tạo ảnh** (IDM-VTON trên Hugging Face). Chi tiết hiện tại xem [CONTEXT.md](CONTEXT.md) mục 4.

> **Trạng thái:** v0.2 (31/10/2026) — đã chốt yêu cầu (mục 11), đã code xong Giai đoạn 0–5. Cách chạy: xem [README.md](README.md).
> **Đi kèm:** [BRAND.md](BRAND.md) — quy chuẩn giao diện / phong cách.
> **Cách dùng file này:** làm lần lượt từng giai đoạn, tick `[x]` khi xong. Mục **"Cần học"** / **"API then chốt"** giúp bạn hiểu code để thuyết trình đồ án.

---

## 1. Mục tiêu

Một website bán quần áo, trong đó ở trang chi tiết sản phẩm có nút **"Thử ngay"**:
người dùng bật camera → thấy mình "mặc" món đồ đó trên màn hình → chụp ảnh lại / thêm vào giỏ.

**Tiêu chí thành công của bản đầu tiên (MVP — sản phẩm tối thiểu chạy được):**
- Xem danh sách & chi tiết sản phẩm, lọc theo loại.
- Thử **áo** (phần thân trên) trực tiếp qua camera, hình áo bám theo vai khi người dùng di chuyển.
- Chụp lại ảnh đang thử.
- Thêm vào giỏ, đặt hàng (thanh toán khi nhận hàng — COD).

---

## 2. Hai cách làm "thử đồ" — và lựa chọn đề xuất

Đây là quyết định quan trọng nhất của dự án, nên giải thích kỹ:

| | **Cách A — AR 2D trực tiếp** | **Cách B — AI tạo ảnh** |
|---|---|---|
| Ý tưởng | Máy tính nhận diện **khung xương** (vai, hông…) từ camera, rồi "dán" ảnh áo (PNG nền trong suốt) lên đúng vị trí, xoay/co giãn theo người | Chụp 1 ảnh người + ảnh áo → gửi lên một **mô hình AI** → nhận lại ảnh người mặc áo, rất chân thực |
| Tốc độ | Thời gian thực (~30 khung hình/giây) | Chờ khoảng 5–30 giây mỗi ảnh |
| Độ chân thật | Trung bình (giống "sticker" bám theo người) | Cao (có nếp vải, ánh sáng) |
| Chi phí | **Miễn phí** — chạy ngay trên trình duyệt của khách | **Tốn phí** theo lượt gọi API (cần kiểm tra bảng giá nhà cung cấp) |
| Riêng tư | Ảnh **không rời khỏi máy** khách | Ảnh phải gửi lên server bên thứ ba |
| Độ khó | Vừa — học được nhiều về toán hình học | Dễ phần code, khó phần server/chi phí/bảo mật key |

**✅ Đã chốt: chỉ dùng Cách A** (miễn phí cho người dùng, không tốn phí API). Cách B để dành làm hướng phát triển trong báo cáo đồ án.

---

## 3. Công nghệ đề xuất (Tech stack)

| Phần | Công cụ | Giải thích ngắn |
|---|---|---|
| Ngôn ngữ | **TypeScript** | JavaScript có thêm "kiểu dữ liệu" → báo lỗi sớm khi gõ sai |
| Framework | **Next.js 16** (dùng React 19) | Làm cả giao diện lẫn API server trong 1 dự án |
| Giao diện | **Tailwind CSS** | Viết style bằng class ngắn; các màu/font trong BRAND.md sẽ khai báo thành "token" ở đây |
| Giỏ hàng | **Zustand** + localStorage | Lưu giỏ hàng ngay trên trình duyệt |
| Kiểm tra form | **Zod** | Kiểm tra dữ liệu đặt hàng ở server |
| Nhận diện cơ thể | **MediaPipe Pose Landmarker** (`@mediapipe/tasks-vision`) của Google | Trả về 33 điểm trên cơ thể, chạy ngay trên trình duyệt |
| Cơ sở dữ liệu | **SQLite + Prisma 6** (khoá phiên bản 6.19 — bản 8 còn đang thử nghiệm) | SQLite = database nằm trong 1 file, không cần cài server. Prisma = công cụ đọc/ghi DB bằng code TypeScript |
| Ảnh sản phẩm | Lưu trong `public/` lúc đầu → sau chuyển sang dịch vụ lưu ảnh (Cloudinary/S3) | |
| Triển khai (deploy) | **Vercel** | Gói miễn phí, có sẵn HTTPS (camera **bắt buộc** HTTPS khi lên mạng) |

> 💡 **Vì sao camera cần HTTPS?** Trình duyệt chỉ cho phép trang web mở camera khi trang đó chạy qua kết nối bảo mật (`https://`) hoặc trên máy bạn (`localhost`). Nên lúc code ở máy thì thoải mái, khi đưa lên mạng phải có HTTPS (Vercel lo sẵn).

**Môi trường trên máy bạn (đã kiểm tra):** Node.js v22 ✅, Python 3.12 ✅.

---

## 4. Thiết kế tính năng thử đồ (Cách A) — tư duy thuật toán

### 4.1. Luồng hoạt động
```
[Bấm "Thử ngay"] → Hỏi quyền camera → Bật video
      ↓
Mỗi khung hình (requestAnimationFrame):
   1. Đưa khung hình vào PoseLandmarker → nhận 33 điểm (toạ độ 0..1)
   2. Lấy điểm vai trái (11), vai phải (12), hông trái (23), hông phải (24)
   3. Tính vị trí, kích thước, góc xoay của áo
   4. Làm mượt (giảm rung)
   5. Vẽ video + áo lên <canvas>
      ↓
[Chụp ảnh] → canvas → file ảnh → tải về / dùng cho Cách B
```

### 4.2. Phần toán (bạn sẽ tự cài đặt)
- **Đổi toạ độ:** điểm MediaPipe trả về nằm trong khoảng 0..1 → nhân với chiều rộng/cao của canvas để ra pixel.
- **Độ rộng vai** = khoảng cách giữa 2 điểm vai (`Math.hypot(dx, dy)`).
- **Độ rộng áo** = độ rộng vai × hệ số (thử khoảng 1.4–1.7, mỗi sản phẩm có thể khác).
- **Góc nghiêng** = `Math.atan2(dy, dx)` giữa 2 vai → để xoay áo khi người nghiêng.
- **Điểm neo** = trung điểm 2 vai, dịch lên một chút (phần cổ áo).
- **Chiều dài áo** = khoảng cách vai → hông (giúp áo không bị quá ngắn/dài).
- **Làm mượt:** dùng *trung bình trượt mũ* (EMA): `giáTrịMới = cũ * 0.7 + đo_được * 0.3` → áo không bị giật.
- **Hiệu ứng gương:** lật ngang video (người dùng quen nhìn như soi gương) — nhớ lật cả toạ độ x.
- **Khi không thấy người / thiếu vai:** ẩn áo + hiện hướng dẫn "Hãy lùi lại để thấy rõ vai".

### 4.3. Yêu cầu với ảnh sản phẩm dùng để thử (rất quan trọng)
Mỗi sản phẩm cần 1 ảnh **"try-on asset"** riêng:
- Tách làm 3 phần nền trong suốt: **thân áo** (khung 400×400, hai vai ở (112,78) và (288,78)), **tay áo trên** và **tay áo dưới** (khung 100×300, dựng đứng). Tay áo được vẽ dọc theo cánh tay nên áo "đi theo" khi người dùng cử động tay.
- Quy ước nằm trong `src/features/try-on/garment-geometry.ts`.
- Hiện dùng **hình minh hoạ SVG tự vẽ** (`npm run garments`) vì chưa có ảnh thật.
- Chỉ hỗ trợ **áo**. Quần/váy làm sau vì khó hơn (chân chuyển động nhiều).

### 4.4. API then chốt
- `navigator.mediaDevices.getUserMedia({ video: true })` — mở camera
- `FilesetResolver.forVisionTasks()`, `PoseLandmarker.createFromOptions()`, `poseLandmarker.detectForVideo()` — nhận diện khung xương
- `requestAnimationFrame()` — vòng lặp vẽ mỗi khung hình
- Canvas 2D: `ctx.save()`, `ctx.translate()`, `ctx.rotate()`, `ctx.scale(-1, 1)`, `ctx.drawImage()`, `ctx.restore()`
- `canvas.toBlob()` — chụp ảnh
- `MediaStreamTrack.stop()` — **tắt camera** khi rời trang (rất hay bị quên!)

---

## 5. Thử đồ bằng AI (Cách B) — sau MVP

```
Ảnh chụp (Cách A) + ảnh sản phẩm
   → POST /api/try-on (server của mình, giữ API key bí mật)
   → gọi nhà cung cấp AI → chờ kết quả (polling)
   → trả ảnh về cho trình duyệt
```
- **API key** (chìa khoá để dùng dịch vụ trả phí) chỉ để trong file `.env.local` trên server, **không bao giờ** đưa vào code phía trình duyệt hay lên GitHub.
- Giới hạn số lượt/người/ngày (rate limit) để không bị "đốt" tiền.
- Mặc định **không lưu** ảnh người dùng; nếu lưu phải hỏi ý kiến và tự xoá sau X ngày.

---

## 6. Cấu trúc thư mục dự kiến

```
ClothShop-AITryOn/
├── PLAN.md, BRAND.md
├── prisma/
│   ├── schema.prisma        # định nghĩa bảng dữ liệu
│   └── seed.ts              # dữ liệu mẫu
├── public/
│   ├── products/            # ảnh sản phẩm
│   └── tryon/               # ảnh PNG trong suốt để thử
└── src/
    ├── app/                 # các trang (Next.js App Router)
    │   ├── page.tsx                 # Trang chủ
    │   ├── shop/page.tsx            # Danh sách sản phẩm
    │   ├── product/[slug]/page.tsx  # Chi tiết sản phẩm
    │   ├── try-on/page.tsx          # Phòng thử đồ
    │   ├── cart/page.tsx            # Giỏ hàng
    │   ├── checkout/page.tsx        # Đặt hàng
    │   └── api/                     # API server (try-on AI, đơn hàng)
    ├── components/          # Nút, thẻ sản phẩm, header...
    ├── features/try-on/     # Toàn bộ logic thử đồ: camera, pose, vẽ
    ├── lib/                 # Hàm dùng chung (format tiền, db...)
    └── styles/              # Token màu/font từ BRAND.md
```

## 7. Dữ liệu (bảng chính)

- **Product**: id, tên, slug (đường dẫn đẹp, vd `ao-thun-basic-trang`), mô tả, giá, danh mục, ảnh, `tryOnType` (`top` | `outerwear` | `none`), `tryOnAsset` (đường dẫn PNG), `tryOnAnchors` (điểm neo vai), `widthFactor`.
- **Variant**: productId, size (S/M/L/XL), màu, tồn kho.
- **Order**: id, tên khách, SĐT, địa chỉ, tổng tiền, trạng thái, ngày tạo.
- **OrderItem**: orderId, variantId, số lượng, giá lúc mua.
- Giỏ hàng lúc đầu lưu ở trình duyệt (`localStorage`), chưa cần đăng nhập.

---

## 8. Lộ trình theo giai đoạn

### Giai đoạn 0 — Chuẩn bị (≈ 1 buổi)
- [ ] Sao lưu hệ thống bằng **Timeshift** trước khi cài thêm công cụ *(bạn tự làm)*
- [x] `git init` — bật quản lý phiên bản (lưu lại lịch sử thay đổi code, quay lại được khi lỡ hỏng)
- [ ] Cài VS Code + extension: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma *(bạn tự làm)*
- [x] Tạo dự án Next.js (TypeScript + Tailwind + App Router)
- **Cần học:** lệnh `cd`, `ls`, `npm install`, `npm run dev`; git cơ bản (`add`, `commit`)

### Giai đoạn 1 — Thử nghiệm camera riêng lẻ (Prototype) (≈ 2–4 buổi)
> Làm phần khó nhất **trước** để chắc chắn ý tưởng khả thi, rồi mới làm phần shop.
- [x] Bật camera, hiện video lật gương (làm thẳng trong `/try-on`)
- [x] Gắn MediaPipe, vẽ chấm đỏ lên vai/hông để kiểm tra
- [x] Dán 1 ảnh áo PNG lên theo vai (vị trí → kích thước → góc xoay)
- [x] Làm mượt + xử lý khi mất dấu người
- [x] Nút chụp ảnh, nút tắt camera
- **Cần học:** React `useRef`, `useEffect` (dọn dẹp khi rời trang), Canvas 2D, toán vector cơ bản

### Giai đoạn 2 — Khung website + áp dụng Brand (≈ 2–3 buổi)
- [x] Khai báo token màu/font/khoảng cách từ BRAND.md vào Tailwind
- [x] Layout chung: Header (logo, menu, giỏ hàng), Footer
- [x] Component cơ bản: Button, Badge, Input, ProductCard
- [x] Trang chủ: banner, sản phẩm nổi bật, khối giới thiệu "Thử đồ bằng camera"
- **Cần học:** Tailwind, component React & `props`, responsive (giao diện tự co giãn theo màn hình)

### Giai đoạn 3 — Sản phẩm (Catalog) (≈ 3–4 buổi)
- [x] Prisma + SQLite, viết `schema.prisma`, file seed 10 sản phẩm mẫu
- [x] Trang danh sách: lưới sản phẩm, lọc theo danh mục, sắp xếp theo giá
- [x] Trang chi tiết: ảnh, chọn size/màu, nút **"Thử ngay"** (mọi sản phẩm đều thử được)
- **Cần học:** Server Components của Next.js, route động `[slug]`, Prisma `findMany`/`findUnique`

### Giai đoạn 4 — Gắn phòng thử đồ vào shop (≈ 2–3 buổi)
- [x] Module `features/try-on`, nhận dữ liệu sản phẩm qua props
- [x] Trang `/try-on?product=…&color=…`: hướng dẫn tư thế, thông báo quyền riêng tư, đổi màu/mẫu, tinh chỉnh độ rộng/vị trí, bật khung xương
- [ ] **Kiểm tra với camera thật trên laptop** *(bạn chạy thử và báo lại)*
- [x] Nút "Thêm vào giỏ" ngay trong phòng thử
- [x] Xử lý lỗi: từ chối quyền camera, không có camera, camera bận; phương án "Tải ảnh lên"

### Giai đoạn 5 — Giỏ hàng & Đặt hàng (≈ 3 buổi)
- [x] Giỏ hàng lưu `localStorage` (thêm/xoá/sửa số lượng)
- [x] Form đặt hàng + kiểm tra dữ liệu (thư viện **Zod**)
- [x] Lưu đơn vào DB, trang "Đặt hàng thành công"
- **Cần học:** React Context hoặc **Zustand** (quản lý trạng thái giỏ hàng), Server Actions / Route Handlers

### Giai đoạn 6 — ~~Thử đồ AI (Cách B)~~ → bỏ, thay bằng: Ảnh thật & giao diện bán lẻ
- [x] Đổi giao diện sang phong cách bán lẻ (header tìm kiếm, voucher, bộ lọc màu/giá, trang chi tiết kiểu khuyến mãi)
- [x] Mã giảm giá AURA30K/50K/100K/200K (kiểm tra ở cả trình duyệt và server)
- [x] Ảnh thật cho 6 sản phẩm (`public/products/`)
- [ ] Nhận ảnh **toàn thân áo chính diện**, tách nền, cắt thành thân áo / tay áo theo quy ước mục 4.3 để phòng thử dùng ảnh thật

### Giai đoạn 7 — Trang quản trị (Admin) (≈ 3–4 buổi)
- [ ] Đăng nhập admin (Auth.js)
- [ ] Thêm/sửa/xoá sản phẩm, upload ảnh, **công cụ đặt điểm neo vai** cho ảnh try-on (kéo 2 chấm lên ảnh)
- [ ] Xem & cập nhật trạng thái đơn hàng

### Giai đoạn 8 — Hoàn thiện & Đưa lên mạng (≈ 2 buổi)
- [ ] Kiểm tra trên nhiều laptop / trình duyệt (Chrome, Edge, Firefox)
- [ ] Tối ưu ảnh (`next/image`), điểm Lighthouse
- [ ] Chuyển DB sang dịch vụ online (vd: Postgres trên Neon/Supabase) — SQLite không dùng được trên Vercel
- [ ] Deploy lên Vercel, gắn tên miền (nếu có)

---

## 9. Quyền riêng tư & Bảo mật
- Trước khi bật camera: hiện thông báo rõ ràng "Hình ảnh chỉ xử lý trên máy bạn, không gửi đi đâu" (đúng với Cách A).
- Cách B: phải xin đồng ý riêng trước khi gửi ảnh lên server. Tham khảo **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân nếu kinh doanh thật.
- Luôn tắt camera khi rời trang / đóng phòng thử.
- Không commit file `.env*` lên Git (thêm vào `.gitignore`).

## 10. Rủi ro & cách giảm

| Rủi ro | Cách giảm |
|---|---|
| Áo "trôi", rung, lệch | EMA làm mượt; chỉnh `widthFactor` từng sản phẩm; điểm neo chính xác |
| Máy yếu / điện thoại cũ chạy chậm | Dùng model `pose_landmarker_lite`; giảm độ phân giải video; xử lý mỗi 2 khung hình |
| Ảnh sản phẩm không có nền trong suốt | Dùng công cụ xoá nền (remove.bg, hoặc thư viện `rembg` bằng Python) |
| Chi phí AI vượt kiểm soát | Rate limit, đặt hạn mức chi tiêu trên trang nhà cung cấp |
| Safari iOS khác Chrome | Thêm thuộc tính `playsInline`, `muted` cho thẻ video; test sớm |

---

## 11. ✅ Quyết định đã chốt (31/10/2026)
1. **Mục đích:** đồ án (không kinh doanh thật) → thanh toán COD, chưa cần cổng thanh toán.
2. **Phong cách:** ~~sang trọng~~ → **bán lẻ thời trang nam hiện đại** (tham khảo bố cục savani.vn: nền trắng, giá đỏ, voucher, bộ lọc). Tên tạm: **AURA Fashion** (xem BRAND.md v0.3).
3. **Sản phẩm:** chỉ **áo** (sơ mi, thun, polo, áo len, blazer).
4. **Ảnh:** đã có 6 ảnh thật (ảnh cận cổ áo) → dùng làm ảnh cửa hàng; phòng thử vẫn dùng hình minh hoạ SVG cho tới khi có ảnh **toàn thân áo, chính diện**.
5. **Thử đồ:** miễn phí cho người dùng → chỉ dùng AR 2D (Cách A).
6. **Khách dùng laptop** (webcam), chưa làm app di động.
7. Bạn nhờ code trực tiếp (không chỉ hướng dẫn).
