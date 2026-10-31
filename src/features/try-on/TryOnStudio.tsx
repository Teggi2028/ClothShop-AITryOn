"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { Camera, Check, Download, ImageUp, Loader2, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import {
  type BodyFrame,
  type Fit,
  type GarmentImages,
  drawGarment,
  drawSkeleton,
  extractBodyFrame,
  loadGarment,
  smoothBodyFrame,
} from "./garment-renderer";
import { type RunningMode, createPoseLandmarker } from "./pose-detector";

export type TryOnProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  sizes: string[];
  fitWidth: number;
  fitOffsetY: number;
  colors: {
    key: string;
    name: string;
    hex: string;
    image: string;
    photo: string | null;
    torsoAsset: string;
    sleeveUpperAsset: string;
    sleeveLowerAsset: string | null;
  }[];
};

type Mode = "idle" | "loading" | "camera" | "photo" | "error";
type Capture = { url: string; name: string };

// Mất dấu người quá số khung hình này thì ẩn áo (tránh áo "nháy" khi nhận diện chập chờn)
const LOST_FRAMES_LIMIT = 8;

export function TryOnStudio({
  products,
  initialSlug,
  initialColor,
}: {
  products: TryOnProduct[];
  initialSlug?: string;
  initialColor?: string;
}) {
  const initialProduct = products.find((p) => p.slug === initialSlug) ?? products[0];

  // ----- Trạng thái hiển thị (thay đổi → React vẽ lại giao diện) -----
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [productSlug, setProductSlug] = useState(initialProduct.slug);
  const [colorKey, setColorKey] = useState(
    initialProduct.colors.some((c) => c.key === initialColor) ? initialColor! : initialProduct.colors[0].key,
  );
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const addToCart = useCart((s) => s.add);

  const product = products.find((p) => p.slug === productSlug) ?? products[0];
  const color = product.colors.find((c) => c.key === colorKey) ?? product.colors[0];

  // ----- Dữ liệu dùng trong vòng lặp vẽ (ref: đổi giá trị KHÔNG làm vẽ lại giao diện) -----
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<{ instance: PoseLandmarker; mode: RunningMode } | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const sourceRef = useRef<"camera" | "photo" | null>(null);
  const garmentRef = useRef<GarmentImages | null>(null);
  const bodyRef = useRef<BodyFrame | null>(null);
  const lostFramesRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const trackingRef = useRef(false);
  const fitRef = useRef<Fit>({ width: 1, offsetY: 0 });
  const skeletonRef = useRef(false);
  const capturesRef = useRef<Capture[]>([]);

  // Tải ảnh áo mỗi khi đổi sản phẩm / màu
  useEffect(() => {
    let cancelled = false;
    loadGarment(color).then(
      (g) => {
        if (!cancelled) garmentRef.current = g;
      },
      () => {
        if (!cancelled) garmentRef.current = null;
      },
    );
    return () => {
      cancelled = true;
    };
  }, [color]);

  // Đồng bộ thông số tinh chỉnh vào ref để vòng lặp vẽ đọc được giá trị mới nhất
  useEffect(() => {
    fitRef.current = { width: product.fitWidth * scale, offsetY: product.fitOffsetY + offset };
    skeletonRef.current = showSkeleton;
  }, [product, scale, offset, showSkeleton]);

  useEffect(() => {
    capturesRef.current = captures;
  }, [captures]);

  // Dọn dẹp khi rời trang: tắt camera, dừng vòng lặp, giải phóng bộ nhớ
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.instance.close();
      landmarkerRef.current = null;
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.src);
      capturesRef.current.forEach((c) => URL.revokeObjectURL(c.url));
    };
  }, []);

  async function getLandmarker(runningMode: RunningMode) {
    const current = landmarkerRef.current;
    if (!current) {
      const instance = await createPoseLandmarker(runningMode);
      landmarkerRef.current = { instance, mode: runningMode };
      return instance;
    }
    if (current.mode !== runningMode) {
      await current.instance.setOptions({ runningMode });
      current.mode = runningMode;
    }
    return current.instance;
  }

  function setTrackingIfChanged(value: boolean) {
    if (trackingRef.current !== value) {
      trackingRef.current = value;
      setTracking(value);
    }
  }

  // ===== Vòng lặp vẽ: chạy ~60 lần/giây bằng requestAnimationFrame =====
  // `now` = thời điểm (ms) do trình duyệt truyền vào — MediaPipe cần mốc thời gian tăng dần
  function renderLoop(now: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const source = sourceRef.current === "camera" ? videoRef.current : photoRef.current;
    if (!canvas || !ctx || !source) return;

    if (sourceRef.current === "camera") {
      const video = videoRef.current!;
      if (video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        // Chỉ nhận diện khi camera có khung hình mới
        if (video.currentTime !== lastVideoTimeRef.current && landmarkerRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const result = landmarkerRef.current.instance.detectForVideo(video, now);
          const raw = extractBodyFrame(result.landmarks[0], canvas.width, canvas.height);
          if (raw) {
            bodyRef.current = smoothBodyFrame(bodyRef.current, raw);
            lostFramesRef.current = 0;
          } else if (++lostFramesRef.current > LOST_FRAMES_LIMIT) {
            bodyRef.current = null;
          }
          setTrackingIfChanged(bodyRef.current !== null);
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Camera: lật ngang toàn bộ để giống soi gương. Ảnh tải lên: giữ nguyên.
    if (sourceRef.current === "camera") ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    const body = bodyRef.current;
    if (body && garmentRef.current) drawGarment(ctx, body, garmentRef.current, fitRef.current);
    if (body && skeletonRef.current) drawSkeleton(ctx, body);

    rafRef.current = requestAnimationFrame(renderLoop);
  }

  function startLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(renderLoop);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startCamera() {
    setMode("loading");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      await getLandmarker("VIDEO");
      sourceRef.current = "camera";
      bodyRef.current = null;
      setMode("camera");
      startLoop();
    } catch (e) {
      stopCamera();
      setError(cameraErrorMessage(e));
      setMode("error");
    }
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setMode("loading");
    setError(null);
    stopCamera();
    try {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await img.decode();
      const landmarker = await getLandmarker("IMAGE");
      const result = landmarker.detect(img);
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.src);
      photoRef.current = img;
      bodyRef.current = extractBodyFrame(result.landmarks[0], img.naturalWidth, img.naturalHeight);
      setTrackingIfChanged(bodyRef.current !== null);
      sourceRef.current = "photo";
      setMode("photo");
      startLoop();
    } catch {
      setError("Không đọc được ảnh hoặc chưa tải được mô hình nhận diện. Bạn thử ảnh khác hoặc kiểm tra kết nối mạng.");
      setMode("error");
    }
  }

  function closeStudio() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    stopCamera();
    sourceRef.current = null;
    bodyRef.current = null;
    setTrackingIfChanged(false);
    setMode("idle");
  }

  function capture() {
    canvasRef.current?.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCaptures((list) => {
          const next = [{ url, name: `${product.name} — ${color.name}` }, ...list];
          next.slice(8).forEach((c) => URL.revokeObjectURL(c.url)); // giữ tối đa 8 ảnh
          return next.slice(0, 8);
        });
      },
      "image/jpeg",
      0.92,
    );
  }

  function selectProduct(slug: string) {
    const next = products.find((p) => p.slug === slug)!;
    setProductSlug(slug);
    // Giữ màu đang chọn nếu mẫu mới cũng có màu đó
    if (!next.colors.some((c) => c.key === colorKey)) setColorKey(next.colors[0].key);
    if (size && !next.sizes.includes(size)) setSize(null);
  }

  function handleAddToCart() {
    if (!size) {
      setSizeError(true);
      return;
    }
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colorKey: color.key,
      colorName: color.name,
      size,
      price: product.price,
      image: color.photo ?? color.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  const live = mode === "camera" || mode === "photo";

  return (
    <div className="grid border-t border-line lg:h-[calc(100vh-104px)] lg:grid-cols-[1fr_380px]">
      {/* ================= Khung camera ================= */}
      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[#0b0b0b] text-white">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className={`max-h-full max-w-full object-contain ${live ? "" : "hidden"}`} />

        {!live && (
          <div className="max-w-md px-8 text-center">
            {mode === "loading" ? (
              <>
                <Loader2 className="mx-auto animate-spin text-white" size={36} strokeWidth={1.2} />
                <p className="mt-6 text-white/70">Đang khởi động camera và mô hình nhận diện…</p>
                <p className="mt-2 text-xs text-white/40">Lần đầu có thể mất vài giây để tải mô hình (~5MB).</p>
              </>
            ) : (
              <>
                <p className="text-xs font-extrabold text-promo uppercase">Phòng thử riêng</p>
                <h1 className="mt-4 text-3xl leading-tight font-extrabold">Ngắm mình trong {product.name}</h1>
                {mode === "error" ? (
                  <p className="mt-6 border border-sale/70 bg-sale/15 px-4 py-3 text-sm text-white/90" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="mt-6 flex items-start gap-3 text-left text-sm text-white/60">
                    <ShieldCheck className="mt-0.5 shrink-0 text-promo" size={18} strokeWidth={1.4} />
                    Hình ảnh chỉ được xử lý ngay trên máy của bạn và không được gửi đi đâu.
                  </p>
                )}
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  <button onClick={startCamera} className="btn btn-accent">
                    <Camera size={16} strokeWidth={1.6} /> {mode === "error" ? "Thử lại" : "Bật camera"}
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="btn border-white text-white hover:bg-white hover:text-ink">
                    <ImageUp size={16} strokeWidth={1.6} /> Tải ảnh lên
                  </button>
                </div>
                <p className="mt-8 text-xs text-white/40">Mẹo: ngồi thẳng, đủ sáng, lùi lại để camera thấy rõ hai vai và khuỷu tay.</p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handlePhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {live && (
          <>
            {/* Trạng thái */}
            <div className="absolute top-5 left-5 flex items-center gap-2 bg-black/60 px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase backdrop-blur">
              <span className={`size-1.5 rounded-full ${tracking ? "animate-pulse bg-[#4ade80]" : "bg-white/40"}`} />
              {tracking
                ? mode === "camera"
                  ? "Đang thử trực tiếp"
                  : "Ảnh của bạn"
                : mode === "camera"
                  ? "Lùi lại để thấy rõ hai vai"
                  : "Không nhận ra dáng người trong ảnh"}
            </div>
            <div className="absolute top-5 right-5 flex gap-2">
              {mode === "photo" && (
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-black/60 px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase backdrop-blur hover:text-promo">
                  <ImageUp size={14} /> Ảnh khác
                </button>
              )}
              <button onClick={closeStudio} className="grid size-9 place-items-center bg-black/60 backdrop-blur hover:text-promo" aria-label="Đóng phòng thử">
                <X size={18} strokeWidth={1.4} />
              </button>
            </div>

            {/* Khung hướng dẫn tư thế khi chưa nhận ra người */}
            {!tracking && mode === "camera" && (
              <svg viewBox="0 0 200 200" className="pointer-events-none absolute h-[70%] text-white/50" fill="none" aria-hidden>
                <circle cx="100" cy="58" r="26" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M30 200 C30 130 60 110 100 110 C140 110 170 130 170 200" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            )}

            <button
              onClick={capture}
              className="absolute bottom-8 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full border-2 border-white bg-black/40 backdrop-blur transition hover:bg-white/20"
              aria-label="Chụp ảnh"
              title="Chụp ảnh"
            >
              <span className="size-11 rounded-full bg-white" />
            </button>
          </>
        )}
      </section>

      {/* ================= Bảng điều khiển ================= */}
      <aside className="overflow-y-auto border-l border-line bg-white p-6">
        <p className="font-bold uppercase">Chọn thiết kế</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {products.map((p) => {
            const thumb = p.colors.find((c) => c.key === colorKey) ?? p.colors[0];
            return (
            <button
              key={p.slug}
              onClick={() => selectProduct(p.slug)}
              className={`relative aspect-[37/48] overflow-hidden bg-surface transition ${p.slug === product.slug ? "ring-2 ring-accent ring-offset-2 ring-offset-white" : "opacity-55 hover:opacity-100"}`}
              title={p.name}
              aria-label={p.name}
              aria-pressed={p.slug === product.slug}
            >
              <Image src={thumb.photo ?? thumb.image} alt="" fill unoptimized className={thumb.photo ? "object-cover" : "object-contain p-1"} />
            </button>
            );
          })}
        </div>

        <div className="mt-8 border-t border-line pt-8">
          <h2 className="text-xl leading-snug font-bold">{product.name}</h2>
          <p className="mt-1 text-lg font-extrabold text-sale">{formatPrice(product.price)}</p>
          <Link href={`/product/${product.slug}`} className="mt-1 inline-block text-[13px] text-accent hover:underline">
            Xem chi tiết sản phẩm
          </Link>

          <p className="mt-6 text-sm text-muted">
            Màu: <span className="text-ink">{color.name}</span>
          </p>
          <div className="mt-3 flex gap-3">
            {product.colors.map((c) => (
              <button
                key={c.key}
                onClick={() => setColorKey(c.key)}
                className={`size-8 rounded-full border border-line ring-offset-2 ring-offset-white ${c.key === color.key ? "ring-2 ring-ink" : ""}`}
                style={{ background: c.hex }}
                aria-label={c.name}
                aria-pressed={c.key === color.key}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-muted">
            <span>Kích cỡ</span>
            {sizeError && <span className="text-sale">Vui lòng chọn kích cỡ</span>}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                }}
                className={`h-10 rounded border text-sm transition ${s === size ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                aria-pressed={s === size}
              >
                {s}
              </button>
            ))}
          </div>

          <button onClick={handleAddToCart} className="btn btn-primary mt-5 w-full uppercase">
            {added ? (
              <>
                <Check size={16} /> Đã thêm vào giỏ
              </>
            ) : (
              "Thêm vào giỏ"
            )}
          </button>
        </div>

        <div className="mt-8 border-t border-line pt-8">
          <p className="font-bold uppercase">Tinh chỉnh độ vừa</p>
          <label className="mt-5 block text-sm text-muted">
            <span className="flex justify-between">
              Độ rộng <span className="text-ink">{Math.round(scale * 100)}%</span>
            </span>
            <input type="range" min={0.8} max={1.3} step={0.01} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="mt-2 w-full accent-[#1f6fc5]" />
          </label>
          <label className="mt-4 block text-sm text-muted">
            <span className="flex justify-between">
              Vị trí lên / xuống <span className="text-ink">{offset > 0 ? "+" : ""}{Math.round(offset * 100)}</span>
            </span>
            <input type="range" min={-0.3} max={0.3} step={0.01} value={offset} onChange={(e) => setOffset(Number(e.target.value))} className="mt-2 w-full accent-[#1f6fc5]" />
          </label>
          <label className="mt-4 flex items-center gap-3 text-sm text-muted">
            <input type="checkbox" checked={showSkeleton} onChange={(e) => setShowSkeleton(e.target.checked)} className="size-4 accent-[#1f6fc5]" />
            Hiện khung xương nhận diện
          </label>
          {(scale !== 1 || offset !== 0) && (
            <button
              onClick={() => {
                setScale(1);
                setOffset(0);
              }}
              className="mt-4 text-[13px] text-accent underline"
            >
              Đặt lại
            </button>
          )}
        </div>

        {captures.length > 0 && (
          <div className="mt-8 border-t border-line pt-8">
            <p className="font-bold uppercase">Ảnh đã chụp</p>
            <p className="mt-2 text-xs text-muted">Bấm vào ảnh để tải về máy.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {captures.map((c, i) => (
                <a key={c.url} href={c.url} download={`aura-thu-do-${captures.length - i}.jpg`} className="group relative block" title={c.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob tạm thời, next/image không cần thiết */}
                  <img src={c.url} alt={c.name} className="aspect-video w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                    <Download size={18} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function cameraErrorMessage(e: unknown) {
  const name = e instanceof DOMException ? e.name : "";
  switch (name) {
    case "NotAllowedError":
      return "Bạn chưa cho phép dùng camera. Hãy bấm biểu tượng ổ khoá trên thanh địa chỉ, cho phép Camera rồi thử lại.";
    case "NotFoundError":
      return "Không tìm thấy camera trên máy. Bạn có thể dùng chức năng Tải ảnh lên.";
    case "NotReadableError":
      return "Camera đang được ứng dụng khác sử dụng (Zoom, Meet…). Hãy tắt ứng dụng đó rồi thử lại.";
    default:
      return "Không khởi động được phòng thử. Kiểm tra kết nối mạng (cần tải mô hình nhận diện) rồi thử lại.";
  }
}
