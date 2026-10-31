// Phần "toán" của phòng thử: từ các điểm cơ thể → tính vị trí, kích thước, góc xoay → vẽ áo lên canvas.
// Toàn bộ toạ độ ở đây là pixel của khung hình GỐC (chưa lật gương).

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { SLEEVE, TORSO, TORSO_SHOULDER_MID, TORSO_SHOULDER_WIDTH } from "./garment-geometry";
import { LM } from "./pose-detector";

export type Point = { x: number; y: number };

export type BodyFrame = {
  shoulderL: Point;
  shoulderR: Point;
  elbowL: Point;
  elbowR: Point;
  wristL: Point;
  wristR: Point;
  hipMid: Point | null; // null khi không thấy hông (thường gặp khi ngồi trước laptop)
};

export type GarmentImages = {
  torso: HTMLImageElement;
  upper: HTMLImageElement;
  lower: HTMLImageElement | null; // null = áo tay ngắn
};

export type Fit = {
  width: number; // hệ số độ rộng (sản phẩm × người dùng chỉnh)
  offsetY: number; // dịch lên/xuống, tính theo bề rộng vai
};

// Điểm vai của MediaPipe nằm ở KHỚP vai, còn đường may vai áo nằm ở MÉP vai → áo cần rộng hơn ~18%
const BASE_WIDTH = 1.18;
const MIN_VISIBILITY = 0.5;

const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const add = (a: Point, v: Point, k = 1): Point => ({ x: a.x + v.x * k, y: a.y + v.y * k });
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Đổi 33 điểm (toạ độ 0..1) của MediaPipe → khung cơ thể (pixel). Trả null nếu không thấy rõ hai vai. */
export function extractBodyFrame(landmarks: NormalizedLandmark[] | undefined, width: number, height: number): BodyFrame | null {
  if (!landmarks) return null;
  const visible = (i: number) => (landmarks[i].visibility ?? 1) >= MIN_VISIBILITY;
  const at = (i: number): Point => ({ x: landmarks[i].x * width, y: landmarks[i].y * height });

  if (!visible(LM.leftShoulder) || !visible(LM.rightShoulder)) return null;
  const shoulderL = at(LM.leftShoulder);
  const shoulderR = at(LM.rightShoulder);
  const shoulderWidth = dist(shoulderL, shoulderR);
  if (shoulderWidth < 20) return null;

  // Vector đơn vị dọc theo vai (phải → trái) và vector "hướng xuống" vuông góc với vai
  const across = { x: (shoulderL.x - shoulderR.x) / shoulderWidth, y: (shoulderL.y - shoulderR.y) / shoulderWidth };
  const down = { x: -across.y, y: across.x };

  // Tay: dùng điểm khuỷu/cổ tay nếu hợp lý; nếu khuất khỏi khung hình hoặc vô lý → giả định tay buông xuôi
  const arm = (shoulder: Point, elbowIdx: number, wristIdx: number, outward: number) => {
    const hang = { x: down.x + across.x * outward * 0.12, y: down.y + across.y * outward * 0.12 };
    let elbow = at(elbowIdx);
    const upperLen = dist(shoulder, elbow);
    if (upperLen < 0.4 * shoulderWidth || upperLen > 1.8 * shoulderWidth) elbow = add(shoulder, hang, 0.95 * shoulderWidth);
    let wrist = at(wristIdx);
    const lowerLen = dist(elbow, wrist);
    if (lowerLen < 0.4 * shoulderWidth || lowerLen > 1.8 * shoulderWidth) wrist = add(elbow, hang, 0.85 * shoulderWidth);
    return { elbow, wrist };
  };
  const left = arm(shoulderL, LM.leftElbow, LM.leftWrist, 1);
  const right = arm(shoulderR, LM.rightElbow, LM.rightWrist, -1);

  const hipMid =
    visible(LM.leftHip) && visible(LM.rightHip) ? mid(at(LM.leftHip), at(LM.rightHip)) : null;

  return {
    shoulderL,
    shoulderR,
    elbowL: left.elbow,
    elbowR: right.elbow,
    wristL: left.wrist,
    wristR: right.wrist,
    hipMid,
  };
}

/**
 * Làm mượt (EMA — trung bình trượt mũ): giá trị mới = cũ + (đo được − cũ) × alpha.
 * alpha nhỏ → mượt nhưng trễ; alpha lớn → nhạy nhưng rung.
 */
export function smoothBodyFrame(prev: BodyFrame | null, next: BodyFrame, alpha = 0.45): BodyFrame {
  if (!prev) return next;
  const s = (a: Point, b: Point) => lerp(a, b, alpha);
  return {
    shoulderL: s(prev.shoulderL, next.shoulderL),
    shoulderR: s(prev.shoulderR, next.shoulderR),
    elbowL: s(prev.elbowL, next.elbowL),
    elbowR: s(prev.elbowR, next.elbowR),
    wristL: s(prev.wristL, next.wristL),
    wristR: s(prev.wristR, next.wristR),
    hipMid: prev.hipMid && next.hipMid ? s(prev.hipMid, next.hipMid) : next.hipMid,
  };
}

/** Vẽ 1 ảnh dựng đứng (tay áo) dọc theo đoạn thẳng from → to */
function drawSegment(ctx: CanvasRenderingContext2D, img: HTMLImageElement, from: Point, to: Point, width: number, extendTop: number, extendBottom: number) {
  const length = dist(from, to);
  // Ảnh tay áo hướng theo trục +y → xoay thêm -90° để trục ảnh trùng với hướng đoạn thẳng
  const angle = Math.atan2(to.y - from.y, to.x - from.x) - Math.PI / 2;
  ctx.save();
  ctx.translate(from.x, from.y);
  ctx.rotate(angle);
  ctx.drawImage(img, -width / 2, -extendTop, width, length + extendTop + extendBottom);
  ctx.restore();
}

export function drawGarment(ctx: CanvasRenderingContext2D, body: BodyFrame, garment: GarmentImages, fit: Fit) {
  const shoulderMid = mid(body.shoulderL, body.shoulderR);
  const shoulderWidth = dist(body.shoulderL, body.shoulderR);
  const widthFactor = BASE_WIDTH * fit.width;

  // 1) Tỉ lệ ngang: bề rộng vai người (pixel) / bề rộng vai trên ảnh áo (đơn vị ảnh)
  const scaleX = (shoulderWidth / TORSO_SHOULDER_WIDTH) * widthFactor;
  // 2) Tỉ lệ dọc: nếu thấy hông thì kéo áo dài theo thân người (giới hạn để áo không méo)
  let scaleY = scaleX;
  if (body.hipMid) {
    const torsoPx = dist(shoulderMid, body.hipMid);
    scaleY = clamp(torsoPx / (TORSO.hipY - TORSO_SHOULDER_MID.y), scaleX * 0.85, scaleX * 1.25);
  }
  // 3) Góc nghiêng của vai
  const angle = Math.atan2(body.shoulderL.y - body.shoulderR.y, body.shoulderL.x - body.shoulderR.x);
  const down = { x: -Math.sin(angle), y: Math.cos(angle) };
  const offset = fit.offsetY * shoulderWidth;

  // Tay áo bám theo trục cánh tay: bắt đầu từ khớp vai (dịch theo offset như thân áo)
  const seamL = add(body.shoulderL, down, offset);
  const seamR = add(body.shoulderR, down, offset);

  // --- Tay áo (vẽ trước để thân áo đè lên chỗ nối) ---
  const sleeveWidth = SLEEVE.widthInTorsoUnits * scaleX;
  for (const [s, elbow, wrist] of [
    [seamL, body.elbowL, body.wristL],
    [seamR, body.elbowR, body.wristR],
  ] as const) {
    if (garment.lower) {
      drawSegment(ctx, garment.lower, elbow, wrist, sleeveWidth * 0.88, sleeveWidth * 0.15, sleeveWidth * 0.1);
      drawSegment(ctx, garment.upper, s, elbow, sleeveWidth, sleeveWidth * 0.3, sleeveWidth * 0.12);
    } else {
      drawSegment(ctx, garment.upper, s, lerp(s, elbow, SLEEVE.shortRatio), sleeveWidth, sleeveWidth * 0.3, 0);
    }
  }

  // --- Thân áo ---
  ctx.save();
  ctx.translate(shoulderMid.x, shoulderMid.y);
  ctx.rotate(angle);
  ctx.translate(0, offset);
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(garment.torso, -TORSO_SHOULDER_MID.x, -TORSO_SHOULDER_MID.y, TORSO.width, TORSO.height);
  ctx.restore();
}

/** Vẽ khung xương (vai, khuỷu, cổ tay, hông) — bật để kiểm tra / thuyết trình */
export function drawSkeleton(ctx: CanvasRenderingContext2D, body: BodyFrame) {
  const lines: [Point, Point][] = [
    [body.shoulderL, body.shoulderR],
    [body.shoulderL, body.elbowL],
    [body.elbowL, body.wristL],
    [body.shoulderR, body.elbowR],
    [body.elbowR, body.wristR],
  ];
  if (body.hipMid) lines.push([mid(body.shoulderL, body.shoulderR), body.hipMid]);
  const r = Math.max(4, dist(body.shoulderL, body.shoulderR) * 0.025);

  ctx.save();
  ctx.strokeStyle = "rgba(176,141,87,0.9)";
  ctx.fillStyle = "#b08d57";
  ctx.lineWidth = r * 0.6;
  for (const [a, b] of lines) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (const p of [body.shoulderL, body.shoulderR, body.elbowL, body.elbowR, body.wristL, body.wristR, body.hipMid]) {
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Không tải được ảnh ${src}`));
    img.src = src;
  });
}

export async function loadGarment(assets: { torsoAsset: string; sleeveUpperAsset: string; sleeveLowerAsset: string | null }): Promise<GarmentImages> {
  const [torso, upper, lower] = await Promise.all([
    loadImage(assets.torsoAsset),
    loadImage(assets.sleeveUpperAsset),
    assets.sleeveLowerAsset ? loadImage(assets.sleeveLowerAsset) : Promise.resolve(null),
  ]);
  return { torso, upper, lower };
}
