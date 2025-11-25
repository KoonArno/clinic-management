// src/app/api/patients/[recordNumber]/route.ts

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { Role } from "@prisma/client";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    recordNumber: string;
  }>;
}

// Zod Schema for Patient Update
const patientUpdateSchema = z.object({
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

// ====================================================================
// GET Handler
// ====================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  const allowedRoles: Role[] = ["reception", "admin", "clinician"];
  const auth = await authorize(request, allowedRoles);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 }
    );
  }

  const { recordNumber } = await params;

  if (
    !recordNumber ||
    recordNumber.includes("api") ||
    recordNumber.includes("patients")
  ) {
    return NextResponse.json(
      { message: "Patient Record Number is required and must be valid." },
      { status: 400 }
    );
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: {
        recordNumber: recordNumber,
      },
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
    });

    if (!patient) {
      return NextResponse.json(
        { message: `Patient with Record Number ${recordNumber} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(patient, { status: 200 });
  } catch (error) {
    console.error("Error fetching single patient:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the patient details." },
      { status: 500 }
    );
  }
}

// ====================================================================
// PUT Handler
// ====================================================================
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 1. Authorize (Reception/Admin only)
  const allowedRoles: Role[] = ["reception", "admin"];
  const auth = await authorize(request, allowedRoles);
  if (!auth.isAuthorized) {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only Reception or Admin can update patient records.",
      },
      { status: 403 }
    );
  }

  const { recordNumber } = await params;
  if (!recordNumber) {
    return NextResponse.json(
      { message: "Record Number is required." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // 2. Zod Validation
    const validationResult = patientUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Validation Error",
          errors: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. Prepare data for update
    const updateData = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: new Date(data.dateOfBirth),
      allergies: data.allergies || null,
      medicalHistory: data.medicalHistory || null,
      currentMedications: data.currentMedications || null,
    };

    // 4. Update data
    const updatedPatient = await prisma.patient.update({
      where: {
        recordNumber: recordNumber,
      },
      data: updateData,
    });

    console.log("Patient Record Updated:", updatedPatient.recordNumber);

    return NextResponse.json(
      {
        message: "Patient record updated successfully",
        recordNumber: updatedPatient.recordNumber,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Patient with Record Number ${recordNumber} not found.` },
        { status: 404 }
      );
    }
    console.error("Patient update error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the patient record" },
      { status: 500 }
    );
  }
}

// ====================================================================
// DELETE Handler
// ====================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 3. NEW: Authorize (Reception/Admin only)
  const allowedRoles: Role[] = ["reception", "admin"];
  const auth = await authorize(request, allowedRoles);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only Reception or Admin can delete patient records.",
      },
      { status: 403 }
    );
  }

  const { recordNumber } = await params;

  if (
    !recordNumber ||
    recordNumber.includes("api") ||
    recordNumber.includes("patients")
  ) {
    return NextResponse.json(
      {
        message:
          "Patient Record Number is required and must be valid for deletion.",
      },
      { status: 400 }
    );
  }

  try {
    await prisma.patient.delete({
      where: {
        recordNumber: recordNumber,
      },
    });

    return NextResponse.json(
      { message: `Patient ${recordNumber} deleted successfully.` },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Patient with Record Number ${recordNumber} not found.` },
        { status: 404 }
      );
    }
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the patient record." },
      { status: 500 }
    );
  }
}
