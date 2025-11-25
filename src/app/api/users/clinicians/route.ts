// src/app/api/users/clinicians/route.ts

import { NextResponse, NextRequest } from 'next/server'; // (TS) 1. Import NextRequest
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { Role } from '@prisma/client'; // (TS) 2. Import Role enum

export async function GET(request: NextRequest) { // (TS) 3. กำหนด Type ให้ request
    
    // (TS) 4. ใช้ Role enum ในการกำหนด Array
    const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
    const auth = await authorize(request, allowedRoles);
    
    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    try {
        const clinicians = await prisma.user.findMany({
            where: {
                role: Role.clinician, // (TS) 5. ใช้ Role enum ในการ Query
            },
            select: {
                id: true,
                username: true,
                fullName: true,
            },
            orderBy: {
                fullName: 'asc',
            }
        });

        return NextResponse.json(clinicians, { status: 200 });

    } catch (error) {
        console.error("Error fetching clinicians:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching clinicians." }, 
            { status: 500 }
        );
    }
}