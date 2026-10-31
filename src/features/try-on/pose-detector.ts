// Khởi tạo MediaPipe Pose Landmarker — mô hình AI của Google nhận diện 33 điểm trên cơ thể.
// Mô hình chạy NGAY TRÊN TRÌNH DUYỆT (WebAssembly + GPU), không gửi hình ảnh đi đâu.
// Tài liệu: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

// Phiên bản phải trùng với package.json để file .wasm khớp với code JS
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm";
// Bản "lite": nhẹ (~5MB), đủ nhanh cho laptop. Có bản "full"/"heavy" chính xác hơn nhưng chậm hơn.
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type RunningMode = "VIDEO" | "IMAGE";

export async function createPoseLandmarker(runningMode: RunningMode) {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  try {
    // Ưu tiên chạy bằng card đồ hoạ (nhanh hơn nhiều)
    return await PoseLandmarker.createFromOptions(vision, options("GPU"));
  } catch {
    // Máy không hỗ trợ WebGL → chạy bằng CPU
    return await PoseLandmarker.createFromOptions(vision, options("CPU"));
  }
}

// Chỉ số các điểm cần dùng (xem hình minh hoạ 33 điểm trong tài liệu MediaPipe)
export const LM = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
} as const;
