// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// (TS) 1. ประกาศ Type ของ "global"
// เพื่อให้ TypeScript รู้จัก global.prisma
// (นี่เป็น Pattern มาตรฐานสำหรับ Next.js + Prisma ในโหมด Development)
declare global {
  var prisma: PrismaClient | undefined;
}

// (TS) 2. กำหนด Type ให้ตัวแปร
let prisma: PrismaClient;

// ป้องกันการสร้าง Prisma Client ซ้ำซ้อนในระหว่างการ Hot Reload ของ Next.js development
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  // (TS) 3. TypeScript รู้จัก global.prisma จาก declare global ด้านบนแล้ว
  prisma = global.prisma;
}

export default prisma;