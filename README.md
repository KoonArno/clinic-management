# 🏥 Clinic Management System

> ระบบจัดการคลินิก (Clinic Management System)  
> พัฒนาโดยใช้ **Next.js 16**, **Prisma ORM**,**TypeScript**, และ **MariaDB/MySQL**  
> รองรับการเข้าสู่ระบบ (Auth), การจัดการผู้ป่วย, การนัดหมาย และการจัดการผู้ใช้ (Role-based)

---

## 🔧 สถาปัตยกรรมระบบ (System Architecture)

โปรเจกต์นี้เป็น **Fullstack Application** โดยใช้ **Next.js** ซึ่งรวมทั้ง Frontend และ Backend อยู่ในโครงสร้างเดียว  
แต่สามารถแยกแนวคิดออกได้เป็น 3 ส่วนดังนี้:

### 🖥️ Frontend
| เทคโนโลยี | รายละเอียด |
|-------------|-------------|
| **Next.js (React 19)** | แสดงผล UI, Routing, และการ Render หน้าเว็บ (Client/Server) |
| **Tailwind CSS v4** | จัดการ Styling และ Layout ให้ responsive |
| **NextAuth (Client)** | ใช้เชื่อมต่อกับระบบ Auth ของฝั่ง backend เพื่อ login/logout |
| **TypeScript** | ใช้สำหรับ Static Typing ใน Components และ Pages |

### ⚙️ Backend
| เทคโนโลยี | รายละเอียด |
|-------------|-------------|
| **Node.js Runtime** | รัน Next.js Server และ API Routes |
| **Next.js API Routes** | ทำหน้าที่เป็น REST API หรือ Server Components |
| **Prisma ORM** | จัดการฐานข้อมูล (CRUD) ผ่าน model |
| **NextAuth.js** | ระบบจัดการการเข้าสู่ระบบและ session |
| **bcryptjs / jsonwebtoken** | ใช้เข้ารหัสรหัสผ่านและสร้าง JWT token |
| **TypeScript** | ใช้สำหรับ Static Typing ใน API Routes และ Logic |

### 💾 Database
| เทคโนโลยี | รายละเอียด |
|-------------|-------------|
| **MariaDB / MySQL** | ฐานข้อมูลหลักของระบบ |
| **Prisma ORM** | เป็นตัวกลางระหว่าง Node.js กับฐานข้อมูล |
| **Prisma Schema** | กำหนดโครงสร้างตารางและความสัมพันธ์ |

---

## 🧭 แผนผังการทำงานของระบบ (Architecture Flow)

```
┌───────────────────────┐
│        Frontend       │
│ (Next.js + React.tsx) │
│                       │
│  • Dashboard          │
│  • Forms / Pages      │
│  • Auth UI            │
└─────────┬─────────────┘
          │
   HTTP (API Routes)
          │
┌─────────▼─────────────┐
│        Backend        │
│ (Node.js + Next.js)   │
│                       │
│ • NextAuth (Auth)     │
│ • Prisma ORM          │
│ • API Endpoints (.ts) │
│ • Bcrypt              │
└─────────┬─────────────┘
          │
  SQL Queries (via Prisma)
          │
┌─────────▼──────────┐
│     Database       │
│  (MariaDB/MySQL)   │
│                    │
│ • Tables: users    │
│ • patients         │
│ • appointments     │
│ • relations / enums│
└────────────────────┘
```

---

## 🧱 เทคโนโลยีหลักที่ใช้

| Layer | เทคโนโลยี |
|--------|-------------|
| Frontend | React 19, Next.js 16, Tailwind CSS v4 |
| Backend | Node.js, Next.js API Routes, NextAuth, Prisma ORM |
| Database | MariaDB/MySQL |
| Auth & Security | bcryptjs, jsonwebtoken |
| Dev Tools | TypeScript, ESLint, dotenv |

---

## 📦 โครงสร้างโปรเจกต์

```
clinic-management-system/
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── src/
│   ├── app/
│   │   ├── api/                   # API routes (.ts)
│   │   │   ├── appointments/      # Appointment endpoints
│   │   │   ├── patients/          # Patient endpoints
│   │   │   ├── users/             # User endpoints
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth configuration
│   │   │   ├── register/route.ts  # Registration endpoint
│   │   │   └── dashboard/stats/route.ts # Dashboard stats
│   │   ├── auth/                  # Auth pages (.tsx)
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/             # Dashboard & main features (.tsx)
│   │   │   ├── appointments/      # Appointment management
│   │   │   └── patients/          # Patient management
│   │   │   └── page.tsx           # Dashboard home
│   │   ├── components/            # Reusable components
│   │   │   ├── AuthProvider.tsx
│   │   │   └── Navbar.tsx
│   │   ├── layout.tsx             # Root layout with AuthProvider
│   │   └── page.tsx               # Home page (redirects)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client instance
│   │   └── auth.ts                # Auth utilities (authorize func)
│   ├── types/
│   │   └── next-auth.d.ts         # NextAuth Type definitions
│   └── middleware.ts              # NextAuth middleware
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.mjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

---

## 🧩 การตั้งค่า Environment Variables

```env
DATABASE_URL="mysql://clinic_user:clinic_password@localhost:3306/clinic_db"
NEXTAUTH_SECRET="your_secret_key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="another_secret_key"
```

---

## 🧾 Prisma Schema (สรุปโมเดล)

| Model | รายละเอียด |
|--------|-------------|
| **User** | ผู้ใช้ระบบ (clinician / reception / admin) มีชื่อผู้ใช้, รหัสผ่าน, บทบาท |
| **Patient** | ผู้ป่วย เก็บข้อมูลส่วนตัว, อาการแพ้, ประวัติการรักษา |
| **Appointment** | การนัดหมายระหว่างผู้ป่วยและแพทย์ มีเวลาเริ่ม/สิ้นสุด, สถานะ, หมายเหตุ |
| **Enum Role** | `clinician`, `reception`, `admin` |
| **Enum AppointmentStatus** | `PENDING`, `COMPLETED` |

---

## 🚀 การรันโปรเจกต์

```bash
# ติดตั้ง dependencies
npm install

# สร้างฐานข้อมูล + ตาราง
npx prisma migrate dev --name init

# เริ่มรันโปรเจกต์
npm run dev
# เปิด http://localhost:3000
```

---

## ✨ ฟีเจอร์หลัก

| หมวด | รายละเอียด |
|-------|-------------|
| 👥 ระบบผู้ใช้ | บทบาท 3 ระดับ: clinician / reception / admin |
| 🔐 Auth | ใช้ NextAuth + bcryptjs |
| 💾 ORM | Prisma ORM เชื่อมต่อ MariaDB/MySQL |
| 🧑‍⚕️ ผู้ป่วย | บันทึก/แก้ไข/ดูข้อมูลผู้ป่วย |
| 📅 การนัดหมาย | บันทึกข้อมูลการนัดหมาย พร้อมแพทย์ ผู้สร้าง และผู้ป่วย |
| 📊 Dashboard | แสดงสถิติภาพรวมสำหรับ Role ที่แตกต่างกัน |
| ⌨️ Typing | Static Type-Checking ด้วย TypeScript ทั้งหมด |
| 📋 สถานะ | มีสถานะนัดหมาย (PENDING / COMPLETED) |
| 🎨 UI | Tailwind CSS (v4) รองรับ responsive design |

---

## 👨‍💻 ผู้พัฒนา
**KoonArno**  
GitHub: [https://github.com/KoonArno](https://github.com/KoonArno)

---
