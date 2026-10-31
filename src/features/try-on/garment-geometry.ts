// "Hợp đồng" kích thước giữa ảnh áo và bộ vẽ trong phòng thử.
// Mọi ảnh thân áo / tay áo (SVG minh hoạ hay PNG chụp thật sau này) phải theo đúng các mốc này
// thì code mới biết đặt áo vào đâu trên người.

export const TORSO = {
  width: 400,
  height: 400,
  // Điểm vai trên ảnh thân áo (ảnh nhìn chính diện: vai PHẢI của người mặc nằm bên TRÁI ảnh)
  shoulderRight: { x: 112, y: 78 },
  shoulderLeft: { x: 288, y: 78 },
  // Đường ngang hông trên ảnh — dùng để co giãn chiều dài áo theo thân người
  hipY: 270,
} as const;

export const TORSO_SHOULDER_WIDTH = TORSO.shoulderLeft.x - TORSO.shoulderRight.x; // 176
export const TORSO_SHOULDER_MID = {
  x: (TORSO.shoulderLeft.x + TORSO.shoulderRight.x) / 2,
  y: TORSO.shoulderLeft.y,
};

export const SLEEVE = {
  // Ảnh tay áo dựng đứng: mép trên giữa (50, 0) gắn vào khớp vai/khuỷu, mép dưới giữa (50, 300) ở khuỷu/cổ tay
  width: 100,
  height: 300,
  // Bề rộng tay áo so với hệ toạ độ ảnh thân áo (bắp tay ≈ 40% bề rộng vai)
  widthInTorsoUnits: 72,
  // Áo tay ngắn: tay áo dài bằng ~45% đoạn vai → khuỷu
  shortRatio: 0.45,
} as const;
