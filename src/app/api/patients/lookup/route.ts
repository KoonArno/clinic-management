// src/app/api/patients/lookup/route.ts

import { NextResponse, NextRequest } from 'next/server'; // (TS) 1. Import NextRequest
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) { // (TS) 2. กำหนด Type
    
    // (TS) 3. request.url เป็น string ต้องใช้ new URL()
    const { searchParams } = new URL(request.url); 
    const query = searchParams.get('query') || '';

    if (!query) {
        return NextResponse.json([], { status: 200 });
    }

    try {
        // (TS) 4. Prisma จะช่วยจัดการ Type ของการค้นหา
        const patients = await prisma.patient.findMany({
            where: {
                OR: [
                    { recordNumber: { contains: query } },
                    { firstName: { contains: query } },
                    { lastName: { contains: query } },
                ],
            },
            select: {
                id: true,
                recordNumber: true,
                firstName: true,
                lastName: true,
            },
            take: 10,
        });

        // (TS) 5. Prisma ช่วยให้มั่นใจว่า 'p' มี id, recordNumber, ...
        const formattedPatients = patients.map(p => ({
            id: p.id,
            display: `${p.recordNumber} - ${p.firstName} ${p.lastName}`,
            recordNumber: p.recordNumber,
        }));

        return NextResponse.json(formattedPatients, { status: 200 });

    } catch (error) {
        console.error("Error searching patients:", error);
        return NextResponse.json(
            { message: "An error occurred during patient lookup." }, 
            { status: 500 }
        );
    }
}