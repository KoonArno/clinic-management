// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
// (TS) 1. Import authOptions ที่เราสร้างไว้จาก lib/auth
import { authOptions } from "@/lib/auth";

// (TS) 2. ใช้ authOptions ที่ import มา
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };