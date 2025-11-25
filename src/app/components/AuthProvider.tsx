// src/app/components/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from 'react'; // (TS) 1. Import React เพื่อใช้ Type

// (TS) 2. สร้าง Interface สำหรับ Props ที่รับเข้ามา
interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * เป็น Client Component ที่ใช้ SessionProvider เพื่อหุ้มส่วนของ App ที่ต้องเข้าถึง Session
 */
// (TS) 3. กำหนด Type ให้กับ Props ({ children }) และ Type ที่ Return (React.JSX.Element)
export default function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}