// src/middleware.ts

import { withAuth, WithAuthOptions } from "next-auth/middleware"; // (TS) 1. Import WithAuthOptions
import { NextRequest, NextResponse } from "next/server"; // (TS) 2. Import NextRequest

// (TS) 3. สร้างตัวแปร options ที่มี Type ชัดเจน
const authOptions: WithAuthOptions = {
    callbacks: {
        // (TS) 4. Callback "authorized" จะได้รับ "token"
        // Type ของ token นี้จะถูกดึงมาจาก src/types/next-auth.d.ts ที่เราสร้างไว้
        // ทำให้ TypeScript รู้ว่า token อาจเป็น null (ถ้ายังไม่ล็อคอิน)
        authorized: ({ token }) => !!token, // เช็คว่ามี token (ล็อคอินแล้ว) หรือไม่
    },
    pages: {
        // หาก `authorized` คืนค่า false (ยังไม่ล็อคอิน)
        // ให้ redirect ไปยังหน้าที่เรากำหนดไว้ใน authOptions
        signIn: '/auth/login',
    },
};

// (TS) 5. ใช้ withAuth หุ้ม middleware หลัก
export default withAuth(
    // `withAuth` จะเพิ่ม token ของผู้ใช้เข้าไปใน `req` ให้อัตโนมัติ
    // (TS) 6. กำหนด Type ให้ req เป็น NextRequest
    function middleware(req: NextRequest) {
        // สามารถเพิ่ม Logic ตรวจสอบ Role ขั้นสูงได้ที่นี่
        // เช่น:
        // const { token } = req.nextauth;
        // if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "admin") {
        //     return NextResponse.redirect(new URL("/dashboard", req.url));
        // }
    },
    authOptions // (TS) 7. ส่ง options ที่เราสร้างไว้เข้าไป
);

// Config: ระบุว่า Middleware นี้จะทำงานกับ Path ไหนบ้าง
// (ส่วนนี้เหมือนเดิม ไม่ต้องแก้)
export const config = {
    /*
     * Matcher นี้จะจับคู่ทุก Path
     * ยกเว้น (?!...) Path ที่ขึ้นต้นด้วย:
     * - api (API routes)
     * - auth (หน้า Login/Register)
     * - _next/static (ไฟล์ static)
     * - _next/image (ไฟล์รูปภาพ)
     * - favicon.ico (ไฟล์ไอคอน)
     */
    matcher: [
        "/((?!api|auth|_next/static|_next/image|favicon.ico).*)",
    ],
};