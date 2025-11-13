// src/types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// (TS) 1. Import Role enum จาก Prisma Schema ของคุณ
// (ต้องรัน npx prisma generate ก่อน)
import { Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * (TS) ขยาย Type ของ User (ที่ได้จาก authorize)
   */
  interface User extends DefaultUser {
    id: number; // (TS) 2. เปลี่ยน id เป็น number ให้ตรงกับ Prisma
    role: Role;
    fullName: string;
  }

  /**
   * (TS) ขยาย Type ของ Session object
   */
  interface Session {
    user: {
      id: number; // (TS) 3. เปลี่ยน id เป็น number
      role: Role;
      fullName: string;
    } & DefaultSession["user"]; // (รวม type พื้นฐาน name, email, image)
  }
}

declare module "next-auth/jwt" {
  /**
   * (TS) ขยาย Type ของ JWT object (token)
   */
  interface JWT extends DefaultJWT {
    id: number; // (TS) 4. เปลี่ยน id เป็น number
    role: Role;
    fullName: string;
  }
}