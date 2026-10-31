// Kiểm tra ảnh TRƯỚC khi gửi cho AI: ảnh có thấy rõ vai và hông không?
// Mô hình thử đồ được huấn luyện bằng ảnh thấy từ đầu đến hông. Ảnh chỉ có mặt (webcam quá gần)
// làm AI khoanh sai vùng áo → mặc sai màu/sai kiểu, lại tốn lượt GPU miễn phí.
// Dùng MediaPipe Pose Landmarker (của Google), chạy NGAY TRÊN TRÌNH DUYỆT, không gửi ảnh đi đâu.
// Tài liệu: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js

import { FilesetResolver, type NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";

// Phiên bản phải trùng với package.json để file .wasm khớp với code JS
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm";
// Bản "lite": nhẹ (~5MB), đủ chính xác để biết vai/hông có trong ảnh hay không
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type RunningMode = "VIDEO" | "IMAGE";

export async function createPoseLandmarker(runningMode: RunningMode) {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode,
    numPoses: 1,
  });
  try {
    // Ưu tiên chạy bằng card đồ hoạ (nhanh hơn nhiều)
    return await PoseLandmarker.createFromOptions(vision, options("GPU"));
  } catch {
    // Máy không hỗ trợ WebGL → chạy bằng CPU
    return await PoseLandmarker.createFromOptions(vision, options("CPU"));
  }
}

// Chỉ số các điểm cần dùng (xem hình 33 điểm trong tài liệu MediaPipe)
const LM = { leftShoulder: 11, rightShoulder: 12, leftHip: 23, rightHip: 24 } as const;

// Toạ độ MediaPipe từ 0 đến 1 (tính theo khung ảnh). Điểm nằm ngoài ảnh vẫn được "đoán" ra
// nhưng toạ độ < 0 hoặc > 1 và độ tin cậy (visibility) thấp.
function isVisible(p: NormalizedLandmark | undefined) {
  return !!p && (p.visibility ?? 0) > 0.5 && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
}

/** Trả về câu nhắc nếu ảnh chưa đạt, hoặc null nếu ảnh dùng được. */
export function framingIssue(landmarks: NormalizedLandmark[] | undefined): string | null {
  if (!landmarks) return "Không thấy người trong ảnh.";
  if (!isVisible(landmarks[LM.leftShoulder]) || !isVisible(landmarks[LM.rightShoulder])) {
    return "Chưa thấy rõ hai vai — hãy lùi ra xa camera hơn.";
  }
  // Hông hay bị áo rộng che nên độ tin cậy thấp (đo thực tế ~0.4) dù vẫn nằm trong ảnh
  // → chỉ xét VỊ TRÍ hông. Ảnh chỉ thấy mặt: hông được đoán ở y ≈ 1.4 (ngoài khung).
  const hipY = (landmarks[LM.leftHip].y + landmarks[LM.rightHip].y) / 2;
  if (hipY > 1) {
    return "Chưa thấy hông — hãy lùi ra xa để thấy từ đầu đến hông.";
  }
  return null;
}
