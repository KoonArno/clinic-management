// src/app/api/appointments/[recordNumber]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth'; // (TS) 1. Import authorize ที่แก้ไขแล้ว
import { Role, AppointmentStatus, Prisma } from '@prisma/client'; // (TS) 2. Import Enums

// (TS) 3. Interface สำหรับ params ที่ Next.js ส่งมาให้
interface RouteParams {
    params: {
        recordNumber: string;
    }
}

// (Helper function: getRecordNumberFromPath - ส่วนนี้เหมือนเดิมครับ)
// (TS) 4. เพิ่ม Type ให้ request
function getRecordNumberFromPath(request: NextRequest): string {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    return segments[segments.length - 1];
}

// ====================================================================
// GET Handler
// ====================================================================
export async function GET(request: NextRequest, { params }: RouteParams) { // (TS) 5. ใช้ Types
    
    // (TS) 6. ใช้ Role enum
    const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
    const auth = await authorize(request, allowedRoles);
    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    const recordNumber = getRecordNumberFromPath(request);

    if (!recordNumber || recordNumber.includes('api')) {
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
                    select: { id: true, recordNumber: true, firstName: true, lastName: true, dateOfBirth: true, gender: true }
                },
                doctor: { 
                    select: { id: true, username: true }
                },
                createdBy: { 
                    select: { id: true, username: true }
                }
            },
        });

        if (!appointment) {
            return NextResponse.json(
                { message: `Appointment ${recordNumber} not found.` },
                { status: 404 }
            );
        }
        
        // (TS) 7. ใช้ Role enum และ auth.userId (เป็น number)
        if (auth.role === Role.clinician && appointment.doctor.id !== auth.userId) {
            return NextResponse.json({ message: "Unauthorized: Clinicians can only view their assigned appointments." }, { status: 403 });
        }
        
        // Flatten structure
        const formattedAppointment = {
            ...appointment,
            patientDetails: appointment.patient,
            doctorDetails: appointment.doctor,
            createdByDetails: appointment.createdBy,
            // (TS) 8. ใช้ undefined เพื่อลบ key (ปลอดภัยกว่า delete)
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

// (TS) 9. สร้าง Interface สำหรับ Body ของ PUT (ทุก field เป็น optional)
interface AppointmentUpdatePayload {
    patientId?: number;
    doctorId?: number | string;
    startTime?: string;
    endTime?: string;
    notesReception?: string | null;
    status?: AppointmentStatus; // (TS) 10. ใช้ enum
    notesDoctor?: string | null;
}

// ====================================================================
// PUT Handler
// ====================================================================
export async function PUT(request: NextRequest, { params }: RouteParams) { // (TS) 11. ใช้ Types
    
    const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
    const auth = await authorize(request, allowedRoles);
    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }
    
    const recordNumber = getRecordNumberFromPath(request);
    // ...
    
    try {
        // (TS) 12. กำหนด Type ให้ body
        const body: AppointmentUpdatePayload = await request.json();
        const { patientId, doctorId, startTime, endTime, notesReception, status, notesDoctor } = body;

        const existingAppointment = await prisma.appointment.findUnique({ 
            where: { recordNumber: recordNumber } 
        });
        if (!existingAppointment) {
            return NextResponse.json({ message: "Appointment not found." }, { status: 404 });
        }

        // --- Role-Specific Logic & Permission Check ---
        // (TS) 13. ใช้ "UncheckedUpdateInput" เพื่อให้สามารถอัปเดต Foreign Key (patientId, doctorId) โดยตรงได้
        const updateData: Prisma.AppointmentUncheckedUpdateInput = {};
        const isClinician = auth.role === Role.clinician;
        const isReception = auth.role === Role.reception;
        const isAdmin = auth.role === Role.admin;

        // (TS) 14. ใช้ auth.userId
        if (isClinician && existingAppointment.doctorId !== auth.userId && !isAdmin) {
             return NextResponse.json({ message: "Clinicians can only edit their own appointments." }, { status: 403 });
        }
        
        if (isReception || isAdmin) {
            if (patientId) updateData.patientId = patientId;
            if (doctorId) updateData.doctorId = parseInt(String(doctorId)); // (TS) 15. แปลงเป็น number
            if (startTime) updateData.startTime = new Date(startTime);
            if (endTime) updateData.endTime = new Date(endTime);
            if (notesReception !== undefined) updateData.notesReception = notesReception;
        }

        if (isClinician || isAdmin) {
            if (status) updateData.status = status;
            if (notesDoctor !== undefined) updateData.notesDoctor = notesDoctor;
        } else if (status || notesDoctor !== undefined) {
             return NextResponse.json({ message: "Reception cannot update status or doctor notes." }, { status: 403 });
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No data provided for update." }, { status: 400 });
        }
        
        // (TS) 16. Type ของ finalStartTime, finalEndTime, finalDoctorId
        const finalStartTime: Date = updateData.startTime ? new Date(updateData.startTime as string) : existingAppointment.startTime;
        const finalEndTime: Date = updateData.endTime ? new Date(updateData.endTime as string) : existingAppointment.endTime;
        const finalDoctorId: number = (updateData.doctorId as number) || existingAppointment.doctorId;

        if (finalStartTime >= finalEndTime) {
            return NextResponse.json({ message: "End time must be after start time." }, { status: 400 });
        }

        // 2. Overlap Check
        if (updateData.startTime || updateData.endTime || updateData.doctorId) {
            const conflict = await prisma.appointment.findFirst({
                where: {
                    doctorId: finalDoctorId,
                    recordNumber: { not: recordNumber }, // ไม่เช็คกับตัวเอง
                    AND: [
                        { startTime: { lt: finalEndTime } }, 
                        { endTime: { gt: finalStartTime } } 
                    ]
                }
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
            data: updateData, // (TS) 17. updateData มี Type ที่ถูกต้องแล้ว
        });

        console.log("Appointment Updated:", updatedAppointment.recordNumber);

        return NextResponse.json(
            { 
                message: "Appointment updated successfully", 
                recordNumber: updatedAppointment.recordNumber,
            }, 
            { status: 200 }
        );

    } catch (error: any) { // (TS) 18. กำหนด Type ให้ error
        console.error("Appointment update error:", error);
        if (error.code === 'P2003' || error.code === 'P2025') { 
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