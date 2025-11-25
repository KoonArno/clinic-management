// src/app/api/appointments/[recordNumber]/route.ts

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { Role, AppointmentStatus, Prisma } from "@prisma/client";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    recordNumber: string;
  }>;
}

// Zod Schema for Appointment Update
const appointmentUpdateSchema = z
  .object({
    patientId: z.number().int().positive().optional(),
    doctorId: z
      .union([z.string(), z.number()])
      .transform((val) => Number(val))
      .optional(),
    startTime: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid start time",
      })
      .optional(),
    endTime: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid end time",
      })
      .optional(),
    notesReception: z.string().nullable().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    notesDoctor: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return end > start;
      }
      return true; // If only one or neither is provided, we can't fully validate range here without fetching existing data, but individual validity is checked above.
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

// ====================================================================
// GET Handler
// ====================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
  const auth = await authorize(request, allowedRoles);
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 }
    );
  }

  const { recordNumber } = await params;

  if (!recordNumber || recordNumber.includes("api")) {
    return NextResponse.json(
      { message: "Appointment Record Number is required." },
      { status: 400 }
    );
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { recordNumber: recordNumber },
      select: {
        recordNumber: true,
        startTime: true,
        endTime: true,
        status: true,
        notesReception: true,
        notesDoctor: true,
        patient: {
          select: {
            id: true,
            recordNumber: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        doctor: {
          select: { id: true, username: true, fullName: true },
        },
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: `Appointment ${recordNumber} not found.` },
        { status: 404 }
      );
    }

    if (auth.role === Role.clinician && appointment.doctor.id !== auth.userId) {
      return NextResponse.json(
        {
          message:
            "Unauthorized: Clinicians can only view their assigned appointments.",
        },
        { status: 403 }
      );
    }

    // Flatten structure
    const formattedAppointment = {
      ...appointment,
      patientDetails: appointment.patient,
      doctorDetails: appointment.doctor,
      createdByDetails: appointment.createdBy,
      patient: undefined,
      doctor: undefined,
      createdBy: undefined,
    };

    return NextResponse.json(formattedAppointment, { status: 200 });
  } catch (error) {
    console.error("Error fetching single appointment:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the appointment details." },
      { status: 500 }
    );
  }
}

// ====================================================================
// PUT Handler
// ====================================================================
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
  const auth = await authorize(request, allowedRoles);
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { message: "Unauthorized access" },
      { status: 401 }
    );
  }

  const { recordNumber } = await params;

  try {
    const body = await request.json();

    // 1. Zod Validation
    const validationResult = appointmentUpdateSchema.safeParse(body);
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
      patientId,
      doctorId,
      startTime,
      endTime,
      notesReception,
      status,
      notesDoctor,
    } = validationResult.data;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { recordNumber: recordNumber },
    });
    if (!existingAppointment) {
      return NextResponse.json(
        { message: "Appointment not found." },
        { status: 404 }
      );
    }

    // --- Role-Specific Logic & Permission Check ---
    const updateData: Prisma.AppointmentUncheckedUpdateInput = {};
    const isClinician = auth.role === Role.clinician;
    const isReception = auth.role === Role.reception;
    const isAdmin = auth.role === Role.admin;

    if (
      isClinician &&
      existingAppointment.doctorId !== auth.userId &&
      !isAdmin
    ) {
      return NextResponse.json(
        { message: "Clinicians can only edit their own appointments." },
        { status: 403 }
      );
    }

    if (isReception || isAdmin) {
      if (patientId) updateData.patientId = patientId;
      if (doctorId) updateData.doctorId = doctorId;
      if (startTime) updateData.startTime = new Date(startTime);
      if (endTime) updateData.endTime = new Date(endTime);
      if (notesReception !== undefined)
        updateData.notesReception = notesReception;
    }

    if (isClinician || isAdmin) {
      if (status) updateData.status = status;
      if (notesDoctor !== undefined) updateData.notesDoctor = notesDoctor;
    } else if (status || notesDoctor !== undefined) {
      return NextResponse.json(
        { message: "Reception cannot update status or doctor notes." },
        { status: 403 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No data provided for update." },
        { status: 400 }
      );
    }

    const finalStartTime: Date = updateData.startTime
      ? new Date(updateData.startTime as string)
      : existingAppointment.startTime;
    const finalEndTime: Date = updateData.endTime
      ? new Date(updateData.endTime as string)
      : existingAppointment.endTime;
    const finalDoctorId: number =
      (updateData.doctorId as number) || existingAppointment.doctorId;

    if (finalStartTime >= finalEndTime) {
      return NextResponse.json(
        { message: "End time must be after start time." },
        { status: 400 }
      );
    }

    // 2. Overlap Check
    if (updateData.startTime || updateData.endTime || updateData.doctorId) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          doctorId: finalDoctorId,
          recordNumber: { not: recordNumber }, // Don't check against itself
          AND: [
            { startTime: { lt: finalEndTime } },
            { endTime: { gt: finalStartTime } },
          ],
        },
      });

      if (conflict) {
        return NextResponse.json(
          { message: "Doctor has a conflicting appointment at this new time." },
          { status: 409 }
        );
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { recordNumber: recordNumber },
      data: updateData,
    });

    console.log("Appointment Updated:", updatedAppointment.recordNumber);

    return NextResponse.json(
      {
        message: "Appointment updated successfully",
        recordNumber: updatedAppointment.recordNumber,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Appointment update error:", error);
    if (error.code === "P2003" || error.code === "P2025") {
      return NextResponse.json(
        { message: "Invalid Doctor ID or Patient ID provided." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "An error occurred while updating the appointment" },
      { status: 500 }
    );
  }
}
