// src/lib/auth.ts

// (TS) 1. Import จาก "next-auth" (ไม่ใช่ "next-auth/next")
import { getServerSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

// (TS) 2. ย้าย authOptions มาไว้ไฟล์นี้ไฟล์เดียว
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });
        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (passwordMatch) {
          return {
            id: user.id,
            name: user.username,
            fullName: user.fullName,
            role: user.role,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as number;
        token.role = user.role;
        token.fullName = user.fullName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.fullName = token.fullName;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
  },
};

// ====================================================================
// (TS) 🔥 นี่คือส่วนที่แก้ไข Error ของคุณ 🔥
// ====================================================================

/**
 * ดึง Session และตรวจสอบสิทธิ์ (สำหรับ App Router)
 * @param {NextRequest} request - (TS) 3. รับ NextRequest (แต่เราจะไม่ใช้มันใน getServerSession)
 * @param {Role[]} allowedRoles - บทบาทที่ได้รับอนุญาต
 */
export async function authorize(
  request: NextRequest, // (TS) 4. ฟังก์ชันยังคงรับ request มา
  allowedRoles: Role[]
): Promise<{
  isAuthorized: boolean;
  userId: number | null;
  role: Role | null;
}> {
  // (TS) 5. 🔥 [การแก้ไข] 🔥
  // เรียก getServerSession(authOptions) โดย *ไม่ต้อง* ส่ง request
  // นี่คือวิธีที่ถูกต้องสำหรับ App Router
  const session = await getServerSession(authOptions);

  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (!userRole) {
    return { isAuthorized: false, userId: null, role: null };
  }

  if (!allowedRoles.includes(userRole)) {
    return { isAuthorized: false, userId: userId || null, role: userRole };
  }

  return { isAuthorized: true, userId: userId || null, role: userRole };
}
