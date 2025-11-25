// src/app/api/patients/route.ts

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { Role } from "@prisma/client";
import { z } from "zod";

// Zod Schema for Patient Creation
const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date of birth",
  }),
  allergies: z.string().nullable().optional(),
  medicalHistory: z.string().nullable().optional(),
  currentMedications: z.string().nullable().optional(),
});

// GET handler: Fetch all patient records
export async function GET(request: NextRequest) {
  const allowedRoles: Role[] = ["reception", "admin", "clinician"];
  const auth = await authorize(request, allowedRoles);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 }
    );
  }

  try {
    const patients = await prisma.patient.findMany({
      select: {
        recordNumber: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        allergies: true,
        medicalHistory: true,
        currentMedications: true,
        id: true,
      },
      orderBy: {
        id: "desc", // Show newest patients first
      },
    });

    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching patient records" },
      { status: 500 }
    );
  }
}

// POST handler: Create new patient record
export async function POST(request: NextRequest) {
  const allowedRoles: Role[] = ["reception", "admin"];
  const auth = await authorize(request, allowedRoles);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only Reception or Admin can create patient records.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // 1. Zod Validation
    const validationResult = patientSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Validation Error",
          errors: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      allergies,
      medicalHistory,
      currentMedications,
    } = validationResult.data;

    // 2. Transactional Creation (Safe Record Number Generation)
    const newPatient = await prisma.$transaction(async (tx) => {
      // Step 1: Create with a temporary unique record number
      const tempRecordNumber = `TEMP-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      const createdPatient = await tx.patient.create({
        data: {
          recordNumber: tempRecordNumber,
          firstName,
          lastName,
          gender,
          dateOfBirth: new Date(dateOfBirth),
          allergies: allergies || null,
          medicalHistory: medicalHistory || null,
          currentMedications: currentMedications || null,
        },
      });

      // Step 2: Generate the final record number based on the auto-incremented ID
      const finalRecordNumber = `PAT-${String(createdPatient.id).padStart(
        3,
        "0"
      )}`;

      // Step 3: Update the record with the final record number
      return await tx.patient.update({
        where: { id: createdPatient.id },
        data: { recordNumber: finalRecordNumber },
      });
    });

    console.log("New Patient Created:", newPatient.recordNumber);

    return NextResponse.json(
      {
        message: "Patient record created successfully",
        recordNumber: newPatient.recordNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Patient creation error:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the patient record" },
      { status: 500 }
    );
  }
}
