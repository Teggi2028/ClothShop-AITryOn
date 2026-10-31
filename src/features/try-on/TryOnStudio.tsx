"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { Camera, Check, Download, ImageUp, Loader2, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { type RunningMode, createPoseLandmarker, framingIssue } from "./photo-check";

export type TryOnProduct = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  sizes: string[];
  colors: {
    key: string;
    name: string;
    hex: string;
    image: string;
  }[];
};

type Photo = { blob: Blob; url: string };
// key = ảnh gốc + áo + màu: bấm lại đúng tổ hợp đã tạo thì dùng lại ảnh cũ, không tốn thêm lượt AI
type Result = { id: number; url: string; name: string; key: string };
// Kết quả kiểm tra ảnh trước khi gửi AI. "skipped": không tải được mô hình kiểm tra, hoặc khách chọn "Vẫn thử"
type PhotoCheck = { status: "checking" } | { status: "ok" } | { status: "bad"; message: string } | { status: "skipped" };

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // khớp giới hạn ở /api/try-on
const MAX_RESULTS = 8;
const COUNTDOWN_SECONDS = 5; // đủ thời gian lùi ra xa laptop

export function TryOnStudio({
  products,
  categories,
  initialSlug,
  initialColor,
}: {
  products: TryOnProduct[];
  categories: { slug: string; name: string }[];
  initialSlug?: string;
  initialColor?: string;
}) {
  const initialProduct = products.find((p) => p.slug === initialSlug) ?? products[0];

  // ----- Trạng thái hiển thị -----
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  // Lời nhắc tư thế khi đang bật camera: undefined = chưa có kết quả, null = tư thế tốt
  const [liveIssue, setLiveIssue] = useState<string | null | undefined>(undefined);
  const [photoCheck, setPhotoCheck] = useState<PhotoCheck>({ status: "checking" });
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [shownResultId, setShownResultId] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [productSlug, setProductSlug] = useState(initialProduct.slug);
  const [pickerCategory, setPickerCategory] = useState(initialProduct.category);
  const [colorKey, setColorKey] = useState(
    initialProduct.colors.some((c) => c.key === initialColor) ? initialColor! : initialProduct.colors[0].key,
  );
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const addToCart = useCart((s) => s.add);

  const product = products.find((p) => p.slug === productSlug) ?? products[0];
  const color = product.colors.find((c) => c.key === colorKey) ?? product.colors[0];
  const shownResult = results.find((r) => r.id === shownResultId) ?? null;
  const photoReady = photoCheck.status === "ok" || photoCheck.status === "skipped";

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const landmarkerRef = useRef<Promise<PoseLandmarker> | null>(null);
  const landmarkerModeRef = useRef<RunningMode>("IMAGE");
  const abortRef = useRef<AbortController | null>(null);
  // Bản sao để hàm dọn dẹp khi rời trang đọc được giá trị mới nhất
  const photoRef = useRef<Photo | null>(null);
  const resultsRef = useRef<Result[]>([]);

  useEffect(() => {
    photoRef.current = photo;
    resultsRef.current = results;
  }, [photo, results]);

  // Rời trang: tắt camera, huỷ yêu cầu đang chạy, giải phóng ảnh tạm trong bộ nhớ
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (liveCheckRef.current) clearInterval(liveCheckRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.then((l) => l.close()).catch(() => {});
      abortRef.current?.abort();
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.url);
      resultsRef.current.forEach((r) => URL.revokeObjectURL(r.url));
    };
  }, []);

  // Mô hình nhận diện dáng người: tạo một lần, dùng chung cho camera (VIDEO) và ảnh (IMAGE)
  async function getLandmarker(runningMode: RunningMode) {
    landmarkerRef.current ??= createPoseLandmarker("IMAGE").catch((e) => {
      landmarkerRef.current = null;
      throw e;
    });
    const instance = await landmarkerRef.current;
    if (landmarkerModeRef.current !== runningMode) {
      await instance.setOptions({ runningMode });
      landmarkerModeRef.current = runningMode;
    }
    return instance;
  }

  // ===== Ảnh của bạn: camera hoặc tải lên =====
  function setPhotoFrom(blob: Blob) {
    if (photo) URL.revokeObjectURL(photo.url);
    const next = { blob, url: URL.createObjectURL(blob) };
    photoRef.current = next; // cập nhật ngay để checkPhoto so sánh đúng ảnh hiện tại
    setPhoto(next);
    setShownResultId(null);
    setError(null);
    setPhotoCheck({ status: "checking" });
    checkPhoto(next.url);
  }

  async function checkPhoto(url: string) {
    try {
      const img = new window.Image();
      img.src = url;
      await img.decode();
      const landmarker = await getLandmarker("IMAGE");
      const message = framingIssue(landmarker.detect(img).landmarks[0]);
      if (photoRef.current?.url !== url) return; // khách đã đổi sang ảnh khác
      setPhotoCheck(message ? { status: "bad", message } : { status: "ok" });
    } catch {
      // Không tải được mô hình kiểm tra (mất mạng…) → không chặn, vẫn cho thử
      if (photoRef.current?.url === url) setPhotoCheck({ status: "skipped" });
    }
  }

  function stopCamera() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(null);
    if (liveCheckRef.current) clearInterval(liveCheckRef.current);
    liveCheckRef.current = null;
    setLiveIssue(undefined);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setError(null);
    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setCameraOn(true);
      startLiveCheck(stream);
    } catch (e) {
      stopCamera();
      setError(cameraErrorMessage(e));
    } finally {
      setCameraStarting(false);
    }
  }

  // Kiểm tra tư thế ~3 lần/giây để nhắc khách lùi ra xa cho tới khi thấy rõ vai và hông
  function startLiveCheck(stream: MediaStream) {
    getLandmarker("VIDEO").then(
      (landmarker) => {
        if (streamRef.current !== stream) return; // camera đã tắt trong lúc tải mô hình
        liveCheckRef.current = setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          setLiveIssue(framingIssue(landmarker.detectForVideo(video, performance.now()).landmarks[0]));
        }, 300);
      },
      () => {}, // không tải được mô hình → bỏ qua lời nhắc, ảnh chụp vẫn dùng được
    );
  }

  // Đếm ngược để kịp lùi ra xa laptop cho camera thấy từ đầu đến hông
  function startCountdown() {
    let left = COUNTDOWN_SECONDS;
    setCountdown(left);
    countdownRef.current = setInterval(() => {
      left -= 1;
      if (left > 0) return setCountdown(left);
      clearInterval(countdownRef.current!);
      countdownRef.current = null;
      setCountdown(null);
      snapshot();
    }, 1000);
  }

  // Chụp khung hình hiện tại, cắt phần giữa theo tỉ lệ 3:4 (giống khung xem trước) và lật như gương
  function snapshot() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const height = video.videoHeight;
    const width = Math.min(video.videoWidth, Math.round((height * 3) / 4));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(-1, 0, 0, 1, width, 0);
    ctx.drawImage(video, (video.videoWidth - width) / 2, 0, width, height, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        setPhotoFrom(blob);
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Tệp bạn chọn không phải là ảnh.");
    if (file.size > MAX_PHOTO_BYTES) return setError("Ảnh quá lớn (tối đa 10MB). Bạn chọn ảnh khác nhé.");
    stopCamera();
    setPhotoFrom(file);
  }

  function reset() {
    stopCamera();
    abortRef.current?.abort();
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setShownResultId(null);
    setError(null);
  }

  // ===== Gửi ảnh lên server để AI tạo ảnh mặc thử =====
  async function generate() {
    if (!photo || !photoReady || generating) return;
    const key = `${photo.url}|${product.slug}|${color.key}`;
    const existing = results.find((r) => r.key === key);
    if (existing) {
      setShownResultId(existing.id);
      setShowOriginal(false);
      return;
    }
    setGenerating(true);
    setError(null);
    setElapsed(0);
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    const controller = new AbortController();
    abortRef.current = controller;

    const body = new FormData();
    body.append("photo", photo.blob, "photo.jpg");
    body.append("slug", product.slug);
    body.append("color", color.key);

    try {
      const res = await fetch("/api/try-on", { method: "POST", body, signal: controller.signal });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Có lỗi khi tạo ảnh. Bạn thử lại nhé.");
      }
      const result = { id: startedAt, url: URL.createObjectURL(await res.blob()), name: `${product.name} — ${color.name}`, key };
      setResults((list) => {
        const next = [result, ...list];
        next.slice(MAX_RESULTS).forEach((r) => URL.revokeObjectURL(r.url));
        return next.slice(0, MAX_RESULTS);
      });
      setShownResultId(result.id);
      setShowOriginal(false);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(
        e instanceof TypeError // fetch ném TypeError khi mất mạng
          ? "Mất kết nối tới cửa hàng. Kiểm tra mạng rồi thử lại nhé."
          : e instanceof Error
            ? e.message
            : "Có lỗi khi tạo ảnh. Bạn thử lại nhé.",
      );
    } finally {
      clearInterval(timer);
      if (abortRef.current === controller) abortRef.current = null;
      setGenerating(false);
    }
  }

  function cancelGenerate() {
    abortRef.current?.abort();
  }

  // ===== Chọn áo & giỏ hàng =====
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
      image: color.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  const stageImage = shownResult && !showOriginal ? shownResult.url : photo?.url;
  const tryOnLabel = `Mặc thử ${product.name}`;

  return (
    <div className="grid border-t border-line lg:h-[calc(100vh-104px)] lg:grid-cols-[1fr_380px]">
      {/* ================= Khung ảnh ================= */}
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden bg-[#0b0b0b] text-white">
        {/* Khung 3:4 giữa màn hình = đúng phần ảnh sẽ được chụp */}
        <div className={cameraOn ? "relative" : "hidden"}>
          <video ref={videoRef} className="aspect-[3/4] h-[min(80vh,720px)] max-w-full -scale-x-100 object-cover" playsInline muted />
          {/* Dáng người mẫu: đầu ở trên, hông chạm mép dưới. Chuyển xanh khi tư thế đạt */}
          <svg
            viewBox="0 0 300 400"
            preserveAspectRatio="none"
            className={`pointer-events-none absolute inset-0 size-full ${liveIssue === null ? "text-[#4ade80]" : "text-white/60"}`}
            fill="none"
            aria-hidden
          >
            <ellipse cx="150" cy="78" rx="34" ry="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 5" />
            <path
              d="M62 385 L66 190 Q70 145 120 136 L180 136 Q230 145 234 190 L238 385"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 5"
            />
            <path d="M40 360 H260" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" />
            <text x="262" y="356" fill="currentColor" fontSize="11" textAnchor="end">hông</text>
          </svg>
        </div>

        {!cameraOn && stageImage && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob tạm thời, next/image không cần thiết */}
            <img
              src={stageImage}
              alt={shownResult && !showOriginal ? `Ảnh AI: ${shownResult.name}` : "Ảnh của bạn"}
              className="max-h-[min(80vh,720px)] max-w-full object-contain"
            />
            {generating && (
              <div className="absolute inset-0 grid place-items-center bg-black/65 px-6 text-center backdrop-blur-[2px]">
                <div>
                  <Loader2 className="mx-auto animate-spin text-promo" size={36} strokeWidth={1.4} />
                  <p className="mt-5 font-bold">AI đang mặc áo cho bạn… {elapsed}s</p>
                  <p className="mt-2 text-xs text-white/60">Thường mất 20–60 giây. Lúc đông người có thể lâu hơn.</p>
                  <button onClick={cancelGenerate} className="mt-5 text-xs text-white/70 underline hover:text-white">
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!cameraOn && !photo && (
          <div className="max-w-md px-8 text-center">
            {cameraStarting ? (
              <>
                <Loader2 className="mx-auto animate-spin text-white" size={36} strokeWidth={1.2} />
                <p className="mt-6 text-white/70">Đang bật camera…</p>
              </>
            ) : (
              <>
                <p className="text-xs font-extrabold text-promo uppercase">Phòng thử AI</p>
                <h1 className="mt-4 text-3xl leading-tight font-extrabold">Xem bạn mặc {product.name}</h1>
                <p className="mt-4 text-sm text-white/70">
                  Chụp một tấm ảnh bằng camera hoặc tải ảnh có sẵn, chọn áo bên phải — AI sẽ tạo ảnh bạn đang mặc chiếc áo đó.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button onClick={startCamera} className="btn btn-accent">
                    <Camera size={16} strokeWidth={1.6} /> Chụp bằng camera
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="btn border-white text-white hover:bg-white hover:text-ink">
                    <ImageUp size={16} strokeWidth={1.6} /> Tải ảnh lên
                  </button>
                </div>
                <ul className="mt-8 space-y-1.5 text-left text-xs text-white/50">
                  <li>• Đứng cách laptop khoảng 1,5 m, nhìn thẳng — ảnh phải thấy rõ từ đầu đến hông.</li>
                  <li>• Tay buông xuôi, không che thân áo; đủ sáng, nền càng đơn giản càng tốt.</li>
                  <li>• Mặc áo ôm vừa người sẽ cho kết quả đẹp hơn áo khoác dày.</li>
                </ul>
                <p className="mt-6 flex items-start gap-3 text-left text-xs text-white/50">
                  <ShieldCheck className="mt-0.5 shrink-0 text-promo" size={16} strokeWidth={1.4} />
                  Khi bấm “Mặc thử”, ảnh của bạn được gửi tới máy chủ AI trên Hugging Face để tạo ảnh. Cửa hàng không lưu ảnh của bạn.
                </p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {/* Nhãn trạng thái */}
        {(cameraOn || photo) && (
          <div className="absolute top-5 left-5 flex max-w-[60%] items-center gap-2 bg-black/60 px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase backdrop-blur">
            {cameraOn && <span className={`size-1.5 shrink-0 rounded-full ${liveIssue === null ? "animate-pulse bg-[#4ade80]" : "bg-white/40"}`} />}
            <span className="truncate">
              {cameraOn
                ? liveIssue === undefined
                  ? "Lùi ra xa cho thấy từ đầu đến hông"
                  : (liveIssue ?? "Tư thế tốt — bấm nút để chụp")
                : shownResult && !showOriginal
                  ? `Ảnh AI · ${shownResult.name}`
                  : "Ảnh của bạn"}
            </span>
          </div>
        )}

        {/* Nút góc phải */}
        {(cameraOn || photo) && !generating && (
          <div className="absolute top-5 right-5 flex gap-2">
            {!cameraOn && (
              <>
                <button onClick={startCamera} className="flex items-center gap-2 bg-black/60 px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase backdrop-blur hover:text-promo">
                  <Camera size={14} /> Chụp lại
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-black/60 px-3 py-1.5 text-[11px] tracking-[0.14em] uppercase backdrop-blur hover:text-promo">
                  <ImageUp size={14} /> Ảnh khác
                </button>
              </>
            )}
            <button
              onClick={cameraOn && photo ? stopCamera : reset}
              className="grid size-9 place-items-center bg-black/60 backdrop-blur hover:text-promo"
              aria-label={cameraOn && photo ? "Tắt camera" : "Đóng"}
            >
              <X size={18} strokeWidth={1.4} />
            </button>
          </div>
        )}

        {/* Camera: đếm ngược + nút chụp */}
        {cameraOn && (
          <>
            {countdown !== null && (
              <span className="pointer-events-none absolute text-8xl font-extrabold text-white drop-shadow-lg" aria-live="assertive">
                {countdown}
              </span>
            )}
            <button
              onClick={startCountdown}
              disabled={countdown !== null}
              className="absolute bottom-8 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full border-2 border-white bg-black/40 backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
              aria-label={`Chụp ảnh sau ${COUNTDOWN_SECONDS} giây`}
              title={`Chụp sau ${COUNTDOWN_SECONDS} giây`}
            >
              <span className="size-11 rounded-full bg-white" />
            </button>
          </>
        )}

        {/* Ảnh: nút tạo ảnh / so sánh / tải về */}
        {!cameraOn && photo && !generating && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2">
            {shownResult && (
              <>
                <div className="flex bg-black/60 text-xs backdrop-blur">
                  <button onClick={() => setShowOriginal(false)} className={`px-3 py-2 ${showOriginal ? "text-white/60" : "bg-white text-ink"}`}>
                    Ảnh AI
                  </button>
                  <button onClick={() => setShowOriginal(true)} className={`px-3 py-2 ${showOriginal ? "bg-white text-ink" : "text-white/60"}`}>
                    Ảnh gốc
                  </button>
                </div>
                <a href={shownResult.url} download={`aura-thu-do-${shownResult.id}.jpg`} className="grid size-9 place-items-center bg-black/60 backdrop-blur hover:text-promo" aria-label="Tải ảnh về" title="Tải ảnh về">
                  <Download size={16} />
                </a>
              </>
            )}
            <button onClick={generate} disabled={!photoReady} className="btn btn-accent shadow-lg">
              {photoCheck.status === "checking" ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang kiểm tra ảnh…
                </>
              ) : (
                <>
                  <Sparkles size={16} strokeWidth={1.6} /> {tryOnLabel}
                </>
              )}
            </button>
          </div>
        )}

        {!cameraOn && photo && photoCheck.status === "bad" && !shownResult && (
          <div className="absolute inset-x-5 top-16 mx-auto max-w-lg border border-promo/70 bg-black/85 px-4 py-3 text-sm backdrop-blur" role="alert">
            <p className="flex items-start gap-2 font-bold">
              <TriangleAlert className="mt-0.5 shrink-0 text-promo" size={16} /> {photoCheck.message}
            </p>
            <p className="mt-1 text-xs text-white/70">
              AI cần thấy từ đầu đến hông mới mặc áo đúng màu, đúng dáng. Ảnh chỉ thấy mặt sẽ cho kết quả sai.
            </p>
            <div className="mt-3 flex gap-4 text-xs">
              <button onClick={startCamera} className="font-bold text-promo underline">
                Chụp lại
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="text-white/80 underline">
                Chọn ảnh khác
              </button>
              <button onClick={() => setPhotoCheck({ status: "skipped" })} className="text-white/50 underline">
                Vẫn thử
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-5 bottom-24 mx-auto flex max-w-lg items-start gap-3 border border-sale/70 bg-[#2a0b0b]/90 px-4 py-3 text-sm text-white/90" role="alert">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label="Đóng thông báo" className="text-white/60 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}
      </section>

      {/* ================= Bảng điều khiển ================= */}
      <aside className="overflow-y-auto border-l border-line bg-white p-6">
        <p className="font-bold uppercase">Chọn thiết kế</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setPickerCategory(c.slug)}
              className={`rounded-full border px-3 py-1 text-xs ${c.slug === pickerCategory ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
              aria-pressed={c.slug === pickerCategory}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-4 grid max-h-[300px] grid-cols-4 gap-2 overflow-y-auto p-1">
          {products.filter((p) => p.category === pickerCategory).map((p) => {
            const thumb = p.colors[0];
            return (
              <button
                key={p.slug}
                onClick={() => selectProduct(p.slug)}
                className={`relative aspect-[37/48] overflow-hidden bg-surface transition ${p.slug === product.slug ? "ring-2 ring-accent ring-offset-2 ring-offset-white" : "opacity-55 hover:opacity-100"}`}
                title={p.name}
                aria-label={p.name}
                aria-pressed={p.slug === product.slug}
              >
                <Image src={thumb.image} alt="" fill unoptimized className="object-cover" />
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

          <button onClick={generate} disabled={!photo || !photoReady || generating} className="btn btn-accent mt-6 w-full">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} strokeWidth={1.6} />}
            {generating ? "Đang tạo ảnh…" : tryOnLabel}
          </button>
          {!photo && <p className="mt-2 text-xs text-muted">Chụp hoặc tải ảnh của bạn lên trước nhé.</p>}
          {photo && photoCheck.status === "bad" && (
            <p className="mt-2 text-xs text-sale">Ảnh chưa thấy rõ từ đầu đến hông — xem hướng dẫn trên ảnh.</p>
          )}

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

        {results.length > 0 && (
          <div className="mt-8 border-t border-line pt-8">
            <p className="font-bold uppercase">Ảnh đã tạo</p>
            <p className="mt-2 text-xs text-muted">Bấm vào ảnh để xem lớn. Ảnh chỉ lưu tạm, tải lại trang sẽ mất.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    stopCamera();
                    setShownResultId(r.id);
                    setShowOriginal(false);
                  }}
                  className={`block ${r.id === shownResultId ? "ring-2 ring-accent ring-offset-2 ring-offset-white" : ""}`}
                  title={r.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob tạm thời */}
                  <img src={r.url} alt={r.name} className="aspect-[3/4] w-full object-cover" />
                </button>
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
      return "Không bật được camera. Bạn có thể dùng chức năng Tải ảnh lên.";
  }
}
