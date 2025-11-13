// src/app/layout.tsx
// (TS) 1. Import React เพื่อใช้ Type
import React from 'react'; 
import { Inter } from 'next/font/google';
import './globals.css';
// (TS) 2. Import AuthProvider (เราสร้างไว้แล้วใน components)
import AuthProvider from '@/app/components/AuthProvider'; 
import { Metadata } from 'next'; // (TS) 3. Import Type Metadata

const inter = Inter({ subsets: ['latin'] });

// (TS) 4. กำหนด Type ให้ metadata
export const metadata: Metadata = {
  title: 'Clinic Management System',
  description: 'Manage clinic appointments and patient records',
};

// (TS) 5. สร้าง Interface สำหรับ Props
interface RootLayoutProps {
  children: React.ReactNode;
}

// (TS) 6. ใช้ Interface กับ Props
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/*
          AuthProvider (SessionProvider) ต้องอยู่ที่นี่
          เพื่อหุ้มแอปทั้งหมดไว้
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}