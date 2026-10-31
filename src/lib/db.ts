import { PrismaClient } from "@prisma/client";

// Giữ 1 kết nối duy nhất: khi chạy `npm run dev`, Next.js nạp lại code liên tục,
// nếu mỗi lần lại `new PrismaClient()` sẽ mở quá nhiều kết nối.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
