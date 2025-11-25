// src/app/api/register/route.ts

import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

// Zod Schema for Registration
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.nativeEnum(Role),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod Validation
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Validation Error",
          errors: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { username, password, role, fullName } = validationResult.data;

    // 2. Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User
    const newUser = await prisma.user.create({
      data: {
        username: username,
        fullName: fullName,
        password: hashedPassword,
        role: role,
      },
    });

    console.log("New User Registered:", newUser.username);

    return NextResponse.json(
      {
        message: "User registered successfully",
        role: newUser.role,
        username: newUser.username,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred while registering" },
      { status: 500 }
    );
  }
}
