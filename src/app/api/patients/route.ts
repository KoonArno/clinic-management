// src/app/api/patients/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { Role } from '@prisma/client'; // (TS) 1. Import Role enum จาก Prisma

// (Helper function: generateRecordNumber - ส่วนนี้เหมือนเดิมครับ)
async function generateRecordNumber() {
    const latestPatient = await prisma.patient.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
    });
    const nextId = (latestPatient?.id || 0) + 1;
    return `PAT-${String(nextId).padStart(3, '0')}`;
}

// GET handler: Fetch all patient records
export async function GET(request: NextRequest) { // (TS) 2. กำหนด Type ให้ request
    // (TS) 3. ใช้ Role enum ในการกำหนดสิทธิ์
    const allowedRoles: Role[] = ['reception', 'admin', 'clinician'];
    const auth = await authorize(request, allowedRoles); 

    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
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
                id: 'desc', // Show newest patients first
            }
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

// (TS) 4. สร้าง Interface สำหรับ Body ที่จะรับเข้ามาใน POST
interface PatientCreatePayload {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string; // รับเป็น string จาก JSON
    allergies?: string | null;
    medicalHistory?: string | null;
    currentMedications?: string | null;
}

// POST handler: Create new patient record
export async function POST(request: NextRequest) { // (TS) 5. กำหนด Type ให้ request
    // (TS) 6. ใช้ Role enum
    const allowedRoles: Role[] = ['reception', 'admin'];
    const auth = await authorize(request, allowedRoles); 
    
    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized: Only Reception or Admin can create patient records." }, { status: 403 });
    }

    try {
        // (TS) 7. กำหนด Type ให้ body ที่อ่านมาจาก request
        const body: PatientCreatePayload = await request.json();
        const { 
            firstName, 
            lastName, 
            gender, 
            dateOfBirth, 
            allergies, 
            medicalHistory, 
            currentMedications 
        } = body;

        // 1. Validation (Check required fields)
        if (!firstName || !lastName || !gender || !dateOfBirth) {
            return NextResponse.json(
                { message: "First name, Last name, Gender, and Date of Birth are required." },
                { status: 400 }
            );
        }

        // 2. Generate automatic record number (PAT-XXX)
        const recordNumber = await generateRecordNumber();

        // 3. Save data to the database
        const newPatient = await prisma.patient.create({
            data: {
                recordNumber: recordNumber,
                firstName: firstName,
                lastName: lastName,
                gender: gender,
                dateOfBirth: new Date(dateOfBirth), // (TS) 8. แปลง string เป็น Date ตอนบันทึก
                allergies: allergies || null, 
                medicalHistory: medicalHistory || null,
                currentMedications: currentMedications || null,
            },
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