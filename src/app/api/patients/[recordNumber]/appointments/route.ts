// src/app/api/patients/[recordNumber]/appointments/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth'; // (TS) 1. Import authorize ที่แก้ไขแล้ว
import { Role, Prisma } from '@prisma/client'; // (TS) 2. Import

// (Helper function: getPatientRecordNumberFromPath - ส่วนนี้เหมือนเดิมครับ)
// (TS) 3. เพิ่ม Type ให้ request
function getPatientRecordNumberFromPath(request: NextRequest): string {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    // The patient record number is the second to last segment: /api/patients/PAT-001/appointments
    return segments[segments.length - 2];
}

// ====================================================================
// GET Handler
// ====================================================================
export async function GET(request: NextRequest) { // (TS) 4. กำหนด Type
    
    // (TS) 5. ใช้ Role enum
    const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
    const auth = await authorize(request, allowedRoles);
    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    const patientRecordNumber = getPatientRecordNumberFromPath(request);

    if (!patientRecordNumber || patientRecordNumber.includes('api') || patientRecordNumber.includes('patients')) {
        return NextResponse.json(
            { message: "Patient Record Number is required and must be valid." }, 
            { status: 400 }
        );
    }

    try {
        // (TS) 6. กำหนด Type ที่ชัดเจนให้ whereClause
        let whereClause: Prisma.AppointmentWhereInput = {
            patient: { 
                recordNumber: patientRecordNumber,
            },
        };

        // (TS) 7. ใช้ Role enum และเช็ค userId
        if (auth.role === Role.clinician && auth.userId) {
            whereClause.doctorId = auth.userId;
        }

        const appointments = await prisma.appointment.findMany({
            where: whereClause, // (TS) 8. ใช้ whereClause ที่มี Type
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
                    }
                },
                doctor: { 
                    select: {
                        username: true,
                    }
                },
                createdBy: { 
                    select: {
                        username: true,
                    }
                }
            },
            orderBy: {
                startTime: 'asc', // เรียงจากเก่าไปใหม่
            }
        });

        // (TS) 9. Prisma ทำให้ apt มี Type ที่ถูกต้องแล้ว
        const formattedAppointments = appointments.map(apt => ({
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
        
        // (TS) 10. เช็คว่ามีข้อมูลก่อนที่จะพยายามเข้าถึง appointments[0]
        const patientDetails = appointments.length > 0 ? {
            name: `${appointments[0].patient.firstName} ${appointments[0].patient.lastName}`,
            recordNumber: appointments[0].patient.recordNumber
        } : null;

        return NextResponse.json({
            appointments: formattedAppointments,
            patient: patientDetails,
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching patient's appointments:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching appointment records for the patient." }, 
            { status: 500 }
        );
    }
}