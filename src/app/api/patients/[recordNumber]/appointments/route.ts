// src/app/api/patients/[recordNumber]/appointments/route.ts

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { Role, Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    recordNumber: string;
  }>;
}

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
    let whereClause: Prisma.AppointmentWhereInput = {
      patient: {
        recordNumber: recordNumber,
      },
    };

    if (auth.role === Role.clinician && auth.userId) {
      whereClause.doctorId = auth.userId;
    }

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
          },
        },
        createdBy: {
          select: {
            username: true,
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
      doctorUsername: apt.doctor.username,
      createdByUsername: apt.createdBy.username,
      notesReception: apt.notesReception,
    }));

    const patientDetails =
      appointments.length > 0
        ? {
            name: `${appointments[0].patient.firstName} ${appointments[0].patient.lastName}`,
            recordNumber: appointments[0].patient.recordNumber,
          }
        : null;

    return NextResponse.json(
      {
        appointments: formattedAppointments,
        patient: patientDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching patient's appointments:", error);
    return NextResponse.json(
      {
        message:
          "An error occurred while fetching appointment records for the patient.",
      },
      { status: 500 }
    );
  }
}
