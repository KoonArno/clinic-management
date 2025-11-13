// src/app/api/appointments/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth'; // (TS) 1. Import authorize ที่แก้ไขแล้ว
import { Role, AppointmentStatus, Prisma } from '@prisma/client'; // (TS) 2. Import Enums และ Prisma Type

// (Helper function: generateRecordNumber - ส่วนนี้เหมือนเดิมครับ)
async function generateRecordNumber() {
    const latestAppointment = await prisma.appointment.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
    });
    const nextId = (latestAppointment?.id || 0) + 1;
    return `APT-${String(nextId).padStart(3, '0')}`;
}

// ====================================================================
// GET Handler
// ====================================================================
export async function GET(request: NextRequest) { // (TS) 3. กำหนด Type
    
    // (TS) 4. ใช้ Role enum
    const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
    // (TS) 5. เรียกใช้ authorize (ซึ่งตอนนี้ทำงานถูกต้องแล้ว)
    const auth = await authorize(request, allowedRoles);

    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }
    
    // (TS) 6. กำหนด Type ให้ whereClause
    let whereClause: Prisma.AppointmentWhereInput = {};

    // (TS) 7. ใช้ Role enum และเช็ค userId
    if (auth.role === Role.clinician && auth.userId) {
        whereClause = {
            doctorId: auth.userId
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

        // (TS) 8. Type ของ apt ถูกต้องอยู่แล้วเพราะ Prisma + Select
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

        return NextResponse.json(formattedAppointments, { status: 200 });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching appointment records" }, 
            { status: 500 }
        );
    }
}

// (TS) 9. สร้าง Interface สำหรับ Body ของ POST
interface AppointmentCreatePayload {
    patientId: number;
    doctorId: number | string; // (TS) 10. รับ string จาก form ได้
    startTime: string; // รับเป็น ISO String
    endTime: string; // รับเป็น ISO String
    notesReception?: string | null;
}

// ====================================================================
// POST Handler
// ====================================================================
export async function POST(request: NextRequest) { // (TS) 11. กำหนด Type
    
    const allowedRoles: Role[] = [Role.reception, Role.admin];
    const auth = await authorize(request, allowedRoles); 

    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized: Only Reception or Admin can create appointments." }, { status: 403 });
    }

    try {
        // (TS) 12. กำหนด Type ให้ body
        const body: AppointmentCreatePayload = await request.json();
        const { patientId, doctorId, startTime, endTime, notesReception } = body;

        // 1. Validation
        if (!patientId || !doctorId || !startTime || !endTime) {
            return NextResponse.json(
                { message: "Patient ID, Doctor ID, Start Time, and End Time are required." },
                { status: 400 }
            );
        }

        const newStartTime = new Date(startTime);
        const newEndTime = new Date(endTime);
        
        if (newStartTime >= newEndTime) {
            return NextResponse.json(
                { message: "End Time must be after Start Time." },
                { status: 400 }
            );
        }

        // 2. Overlap Check
        const numericDoctorId = parseInt(String(doctorId)); // (TS) 13. แปลงเป็น number
        
        const conflict = await prisma.appointment.findFirst({
            where: {
                doctorId: numericDoctorId,
                AND: [
                    { startTime: { lt: newEndTime } }, 
                    { endTime: { gt: newStartTime } }  
                ]
            }
        });

        if (conflict) {
            return NextResponse.json(
                { message: "Doctor has a conflicting appointment at this time." },
                { status: 409 }
            );
        }
        
        // 3. Check patient and doctor
        const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patientExists) {
            return NextResponse.json({ message: "Patient not found." }, { status: 404 });
        }

        // (TS) 14. ใช้ Role enum
        const doctorIsClinician = await prisma.user.findFirst({ 
            where: { id: numericDoctorId, role: Role.clinician } 
        });
        if (!doctorIsClinician) {
            return NextResponse.json({ message: "Doctor not found or is not a clinician." }, { status: 404 });
        }

        const recordNumber = await generateRecordNumber();

        // 5. Get User ID from session
        const createdByUserId = auth.userId; 

        // (TS) 15. ตรวจสอบว่า userId ไม่ใช่ null
        if (!createdByUserId) {
            return NextResponse.json(
                { message: "Authentication error: User ID not found in session." }, 
                { status: 500 }
            );
        }

        // 6. Save data
        const newAppointment = await prisma.appointment.create({
            data: {
                recordNumber: recordNumber,
                patientId: patientId,
                doctorId: numericDoctorId,
                startTime: newStartTime,
                endTime: newEndTime,
                notesReception: notesReception || null,
                createdByUserId: createdByUserId, 
                status: AppointmentStatus.PENDING, // (TS) 16. ใช้ enum
            },
        });

        console.log("New Appointment Created:", newAppointment.recordNumber);

        return NextResponse.json(
            { 
                message: "Appointment created successfully", 
                recordNumber: newAppointment.recordNumber,
            }, 
            { status: 201 }
        );

    } catch (error) {
        console.error("Appointment creation error:", error);
        return NextResponse.json(
            { message: "An error occurred while creating the appointment" }, 
            { status: 500 }
        );
    }
}