// src/app/api/register/route.ts

import { NextResponse, NextRequest } from 'next/server'; // (TS) 1. Import NextRequest
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client'; // (TS) 2. Import Role enum

// (TS) 3. สร้าง Interface สำหรับ Body ที่รับเข้ามา
interface RegisterPayload {
    username: string;
    password: string;
    role: Role; // (TS) 4. ใช้ Role enum
    fullName: string;
}

export async function POST(request: NextRequest) { // (TS) 5. กำหนด Type ให้ request
    try {
        // (TS) 6. กำหนด Type ให้ Body ที่อ่านค่ามา
        const body: RegisterPayload = await request.json();
        const {username, password, role, fullName} = body;
        
        if (!username || !password || !role || !fullName) { 
            return NextResponse.json(
                {message: "Username, password, role, and full name are required"}, 
                {status: 400}
            );
        }

        // (TS) 7. Validate role โดยใช้ enum
        const validRoles: Role[] = [Role.clinician, Role.reception, Role.admin];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                {message: "Invalid role. Must be: clinician, reception, or admin"}, 
                {status: 400}
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { username: username }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "Username already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username: username,
                fullName: fullName,
                password: hashedPassword,
                role: role, // (TS) 8. role ที่ส่งเข้าไปจะปลอดภัย (Type-safe)
            }
        });

        console.log("New User Registered:", newUser.username);

        return NextResponse.json(
            {message: "User registered successfully", role: newUser.role, username: newUser.username}, 
            {status: 201}
        );

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            {message: "An error occurred while registering"}, 
            {status: 500}
        );
    }
}