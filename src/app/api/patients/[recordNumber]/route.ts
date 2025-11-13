// src/app/api/patients/[recordNumber]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { Role } from '@prisma/client'; // (TS) 1. Import Role enum

// (TS) 2. สร้าง Interface สำหรับ params ที่ Next.js ส่งมาให้
interface RouteParams {
    params: {
        recordNumber: string;
    }
}

// (Helper function: getRecordNumberFromPath - ส่วนนี้เหมือนเดิมครับ)
// (TS) 3. เพิ่ม Type ให้ request
function getRecordNumberFromPath(request: NextRequest): string {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    return segments[segments.length - 1];
}

// ====================================================================
// GET Handler
// ====================================================================
export async function GET(request: NextRequest, { params }: RouteParams) { // (TS) 4. ใช้ Types
    // (TS) 5. ใช้ Role enum
    const allowedRoles: Role[] = ['reception', 'admin', 'clinician'];
    const auth = await authorize(request, allowedRoles); 

    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }
    
    // โค้ดเดิมของคุณใช้ helper นี้ ไม่ได้ใช้ params
    const recordNumber = getRecordNumberFromPath(request);

    if (!recordNumber || recordNumber.includes('api') || recordNumber.includes('patients')) {
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
            }
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

// (TS) 6. สร้าง Interface สำหรับ Body ของ PUT
interface PatientUpdatePayload {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string; // รับเป็น string จาก JSON
    allergies?: string | null;
    medicalHistory?: string | null;
    currentMedications?: string | null;
}

// ====================================================================
// PUT Handler
// ====================================================================
export async function PUT(request: NextRequest, { params }: RouteParams) { // (TS) 7. ใช้ Types
    // 1. Authorize (Reception/Admin only)
    const allowedRoles: Role[] = ['reception', 'admin'];
    const auth = await authorize(request, allowedRoles);
    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized: Only Reception or Admin can update patient records." }, { status: 403 });
    }

    const recordNumber = getRecordNumberFromPath(request);
    if (!recordNumber) {
        return NextResponse.json({ message: "Record Number is required." }, { status: 400 });
    }

    try {
        // (TS) 8. กำหนด Type ให้ data
        const data: PatientUpdatePayload = await request.json();
        
        // 2. Validation
        if (!data.firstName || !data.lastName || !data.gender || !data.dateOfBirth) {
            return NextResponse.json(
                { message: "First name, Last name, Gender, and Date of Birth are required." },
                { status: 400 }
            );
        }

        // 3. Prepare data for update
        const updateData = {
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: new Date(data.dateOfBirth), // (TS) 9. แปลง string เป็น Date
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

    } catch (error: any) { // (TS) 10. กำหนด Type ให้ error
        if (error.code === 'P2025') {
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
export async function DELETE(request: NextRequest, { params }: RouteParams) { // (TS) 11. ใช้ Types
    // 3. NEW: Authorize (Reception/Admin only)
    const allowedRoles: Role[] = ['reception', 'admin'];
    const auth = await authorize(request, allowedRoles); 

    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized: Only Reception or Admin can delete patient records." }, { status: 403 });
    }
    
    const recordNumber = getRecordNumberFromPath(request);

    if (!recordNumber || recordNumber.includes('api') || recordNumber.includes('patients')) {
        return NextResponse.json(
            { message: "Patient Record Number is required and must be valid for deletion." }, 
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

    } catch (error: any) { // (TS) 12. กำหนด Type ให้ error
        if (error.code === 'P2025') {
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