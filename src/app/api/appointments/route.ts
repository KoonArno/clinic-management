// src/app/api/appointments/route.ts

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { Role, AppointmentStatus, Prisma } from "@prisma/client";
import { z } from "zod";

// Zod Schema for Appointment Creation
const appointmentSchema = z
  .object({
    patientId: z.number().int().positive("Patient ID is required"),
    doctorId: z.union([z.string(), z.number()]).transform((val) => Number(val)), // Handle string or number input
    startTime: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start time",
      }),
    endTime: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end time",
      }),
    notesReception: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

// GET Handler
export async function GET(request: NextRequest) {
  const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
  const auth = await authorize(request, allowedRoles);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 }
    );
  }

  let whereClause: Prisma.AppointmentWhereInput = {};

  if (auth.role === Role.clinician && auth.userId) {
    whereClause = {
      doctorId: auth.userId,
    };
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        recordNumber: true,
        startTime: true,
        endTime: true,
        status: true,
        notesReception: true,
        patient: {
          select: {
            recordNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            username: true,
            fullName: true,
          },
        },
        createdBy: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const formattedAppointments = appointments.map((apt) => ({
      recordNumber: apt.recordNumber,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      patientRecordNumber: apt.patient.recordNumber,
      doctorFullName: apt.doctor.fullName,
      createdByFullName: apt.createdBy.fullName,
      notesReception: apt.notesReception,
    }));

    return NextResponse.json(formattedAppointments, { status: 200 });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching appointment records" },
      { status: 500 }
    );
  }
}

// POST Handler
export async function POST(request: NextRequest) {
  const allowedRoles: Role[] = [Role.reception, Role.admin];
  const auth = await authorize(request, allowedRoles);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only Reception or Admin can create appointments.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // 1. Zod Validation
    const validationResult = appointmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Validation Error",
          errors: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { patientId, doctorId, startTime, endTime, notesReception } =
      validationResult.data;
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // 2. Transactional Creation (Conflict Check + Safe Record Number)
    const newAppointment = await prisma.$transaction(async (tx) => {
      // Step 1: Check for conflicts (Double-check locking within transaction)
      // Note: Prisma doesn't support explicit row locking easily, but running this check
      // inside the transaction ensures we are reading consistent state relative to other operations in this transaction.
      // For stricter guarantees, we'd need raw SQL `SELECT ... FOR UPDATE` or Serializable isolation level.
      // Given the scope, this is a significant improvement over no transaction.

      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId: doctorId,
          AND: [
            { startTime: { lt: newEndTime } },
            { endTime: { gt: newStartTime } },
          ],
        },
      });

      if (conflict) {
        throw new Error(
          "CONFLICT: Doctor has a conflicting appointment at this time."
        );
      }

      // Step 2: Check patient and doctor existence
      const patientExists = await tx.patient.findUnique({
        where: { id: patientId },
      });
      if (!patientExists) throw new Error("NOT_FOUND: Patient not found.");

      const doctorIsClinician = await tx.user.findFirst({
        where: { id: doctorId, role: Role.clinician },
      });
      if (!doctorIsClinician)
        throw new Error("NOT_FOUND: Doctor not found or is not a clinician.");

      // Step 3: Create with temp record number
      const tempRecordNumber = `TEMP-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const createdByUserId = auth.userId!; // We checked auth.isAuthorized so this should be present

      const createdAppointment = await tx.appointment.create({
        data: {
          recordNumber: tempRecordNumber,
          patientId: patientId,
          doctorId: doctorId,
          startTime: newStartTime,
          endTime: newEndTime,
          notesReception: notesReception || null,
          createdByUserId: createdByUserId,
          status: AppointmentStatus.PENDING,
        },
      });

      // Step 4: Generate final record number
      const finalRecordNumber = `APT-${String(createdAppointment.id).padStart(
        3,
        "0"
      )}`;

      // Step 5: Update
      return await tx.appointment.update({
        where: { id: createdAppointment.id },
        data: { recordNumber: finalRecordNumber },
      });
    });

    console.log("New Appointment Created:", newAppointment.recordNumber);

    return NextResponse.json(
      {
        message: "Appointment created successfully",
        recordNumber: newAppointment.recordNumber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Appointment creation error:", error);

    if (error.message.startsWith("CONFLICT:")) {
      return NextResponse.json(
        { message: error.message.replace("CONFLICT: ", "") },
        { status: 409 }
      );
    }
    if (error.message.startsWith("NOT_FOUND:")) {
      return NextResponse.json(
        { message: error.message.replace("NOT_FOUND: ", "") },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "An error occurred while creating the appointment" },
      { status: 500 }
    );
  }
}
