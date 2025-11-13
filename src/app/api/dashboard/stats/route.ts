// src/app/api/dashboard/stats/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { Role, AppointmentStatus, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    // 1. ตรวจสอบสิทธิ์ (เหมือนเดิม)
    const allowedRoles: Role[] = [Role.reception, Role.admin, Role.clinician];
    const auth = await authorize(request, allowedRoles);
    
    if (!auth.isAuthorized) {
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    try {
        // 2. กำหนดช่วงเวลา (เหมือนเดิม)
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); 

        // 3. สร้างเงื่อนไข (where clauses) ตาม Role (เหมือนเดิม)
        let todayWhere: Prisma.AppointmentWhereInput = {
            startTime: {
                gte: today, 
                lt: tomorrow
            }
        };
        
        let pendingWhere: Prisma.AppointmentWhereInput = {
            status: AppointmentStatus.PENDING
        };

        if (auth.role === Role.clinician) {
            todayWhere.doctorId = auth.userId;
            pendingWhere.doctorId = auth.userId;
        }

        // (TS) 🔥 [แก้ไข] 4. สร้าง Query สำหรับ totalPatients แบบไดนามิก
        let totalPatientsQuery: Promise<number>;

        if (auth.role === Role.clinician) {
            // ถ้าเป็น Clinician: ให้นับจำนวนผู้ป่วย (patientId) ที่ไม่ซ้ำกัน
            // ที่ถูก assign ให้กับ Clinician คนนี้ (auth.userId)
            totalPatientsQuery = prisma.appointment.findMany({
                where: {
                    doctorId: auth.userId,
                },
                distinct: ['patientId'], // (TS) 🔥 นี่คือหัวใจสำคัญ: เลือก patientId ที่ไม่ซ้ำ
                select: {
                    patientId: true
                }
            }).then(distinctAppointments => {
                // ผลลัพธ์ที่ได้คือ array ของ { patientId: ... }
                // เราต้องการแค่ "จำนวน" ของ array นี้
                return distinctAppointments.length;
            });

        } else {
            // ถ้าเป็น Reception หรือ Admin: นับผู้ป่วยทั้งหมดในระบบ (เหมือนเดิม)
            totalPatientsQuery = prisma.patient.count();
        }

        // 5. ดึงข้อมูลทั้ง 3 ส่วนพร้อมกัน (Parallel Queries)
        const [todayCount, totalPatients, pendingCount] = await Promise.all([
            prisma.appointment.count({ where: todayWhere }),
            totalPatientsQuery, // (TS) 🔥 [แก้ไข] 5. ใช้ Query ที่เราสร้างแบบไดนามิก
            prisma.appointment.count({ where: pendingWhere })
        ]);

        // 6. ส่งข้อมูลกลับ (เหมือนเดิม)
        return NextResponse.json(
            { todayCount, totalPatients, pendingCount }, 
            { status: 200 }
        );

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching dashboard stats." }, 
            { status: 500 }
        );
    }
}