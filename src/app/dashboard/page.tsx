// src/app/dashboard/page.tsx
"use client";

// (TS) 1. Import React (สำหรับ useState, useEffect) และ Role enum
import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client'; // (TS) 2. Import Role enum จาก Prisma

// (TS) 3. สร้าง Interface สำหรับเก็บข้อมูล Stats ที่ดึงมาจาก API
interface DashboardStats {
    todayCount: number | string;
    totalPatients: number | string;
    pendingCount: number | string;
}

function DashboardPage() {
  const { data: session, status } = useSession();

  // (TS) 4. กำหนด Type ให้กับ State ที่เก็บ Stats
  const [stats, setStats] = useState<DashboardStats>({
      todayCount: '—',
      totalPatients: '—',
      pendingCount: '—'
  });
  // (TS) 5. กำหนด Type ให้ isLoadingStats
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  let welcomeMessage = "Dashboard Overview";
  
  // (TS) 6. กำหนด Type ของ userRole (ซึ่งจะถูกดึงมาจาก Type ที่เราตั้งค่าไว้ใน next-auth.d.ts)
  let userRole: Role | undefined;
  
  if (status === "loading") {
      welcomeMessage = "Loading...";
  } else if (status === "authenticated") {
      const displayName = session.user.fullName || session.user.name;
      welcomeMessage = `Welcome back, ${displayName}`;
      userRole = session.user.role; // (TS) 7. session.user.role มี Type เป็น Role
  }

  // (TS) 8. useEffect สำหรับดึงข้อมูล Stats
  useEffect(() => {
      // ดึงข้อมูลเมื่อล็อคอินแล้วเท่านั้น
      if (status === "authenticated") {
          const fetchStats = async () => {
              setIsLoadingStats(true);
              try {
                  const response = await fetch('/api/dashboard/stats');
                  if (!response.ok) {
                      throw new Error('Failed to fetch stats');
                  }
                  // (TS) 9. กำหนด Type ให้ data ที่รับมาจาก API
                  const data: DashboardStats = await response.json();
                  setStats(data); // นำข้อมูลที่ได้ไปใส่ใน State
              } catch (error) { // (TS) 10. กำหนด Type ให้ error (เป็น any)
                  console.error("Error fetching stats:", error);
                  // หาก Error, Stats จะยังคงเป็น '—'
              } finally {
                  setIsLoadingStats(false);
              }
          };
          fetchStats();
      }
  }, [status]); // ทำงานใหม่เมื่อสถานะ session เปลี่ยน

  // Role badge styling
  // (TS) 11. กำหนด Type ให้ parameter 'role' เป็น Role enum
  const getRoleBadge = (role: Role): React.JSX.Element => {
    
    // (TS) 12. ใช้ Record<Role, string> เพื่อให้แน่ใจว่ากำหนดค่าครบทุก Role
    const badges: Record<Role, string> = {
      [Role.admin]: "bg-purple-100 text-purple-800 border-purple-200",
      [Role.reception]: "bg-blue-100 text-blue-800 border-blue-200",
      [Role.clinician]: "bg-green-100 text-green-800 border-green-200"
    };
    const roleLabels: Record<Role, string> = {
      [Role.admin]: "Administrator",
      [Role.reception]: "Receptionist",
      [Role.clinician]: "Clinician"
    };

    const style = badges[role] || 'bg-gray-100 text-gray-800';
    const label = roleLabels[role] || role;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            {/* Header Section with Animation */}
            <div className='mb-12 animate-fade-in'>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h1 className='text-4xl font-bold text-gray-900 mb-4 sm:mb-0'>
                        {welcomeMessage}
                    </h1>
                    {/* (TS) 13. ตรวจสอบว่า userRole (ที่เป็น Role | undefined) มีค่าจริงก่อนส่ง */}
                    {status === "authenticated" && userRole && (
                        <div className="flex items-center gap-2">
                            {getRoleBadge(userRole)}
                        </div>
                    )}
                </div>
                <p className="text-gray-600 text-lg">Manage your clinic appointments and patient records efficiently</p>
            </div>
            
            {/* Stats Cards (ส่วน JSX เหมือนเดิม) */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                
                {/* Today's Appointments Card */}
                <div className='bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100'>
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        {/* 4. MODIFIED: แสดงผลค่าจาก State */}
                        <span className="text-3xl font-bold text-gray-900">
                            {isLoadingStats ? '—' : stats.todayCount}
                        </span>
                    </div>
                    <h3 className='text-sm font-medium text-gray-600 mb-1'>Today's Appointments</h3>
                    <p className='text-xs text-gray-500'>Check all scheduled visits</p>
                </div>

                {/* Total Patients Card */}
                <div className='bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100'>
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-green-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        {/* 4. MODIFIED: แสดงผลค่าจาก State */}
                        <span className="text-3xl font-bold text-gray-900">
                            {isLoadingStats ? '—' : stats.totalPatients}
                        </span>
                    </div>
                    <h3 className='text-sm font-medium text-gray-600 mb-1'>Total Patients</h3>
                    <p className='text-xs text-gray-500'>Registered in system</p>
                </div>

                {/* Pending Card */}
                <div className='bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100'>
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-yellow-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        {/* 4. MODIFIED: แสดงผลค่าจาก State */}
                        <span className="text-3xl font-bold text-gray-900">
                            {isLoadingStats ? '—' : stats.pendingCount}
                        </span>
                    </div>
                    <h3 className='text-sm font-medium text-gray-600 mb-1'>Pending</h3>
                    <p className='text-xs text-gray-500'>Awaiting completion</p>
                </div>
            </div>

            {/* Main Action Cards (ส่วน JSX เหมือนเดิม) */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {/* View Appointments Card */}
                <Link href="/dashboard/appointments" className='block group'>
                    <div className='relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] h-64'>
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
                        
                        <div className='relative p-8 h-full flex flex-col justify-between'>
                            <div>
                                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-4xl">📅</span>
                                </div>
                                <h2 className='text-3xl font-bold text-white mb-3'>Appointments</h2>
                                <p className='text-blue-100 text-lg'>View and manage all scheduled appointments</p>
                            </div>
                            <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                <span>Open</span>
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Patient Records Card */}
                <Link href="/dashboard/patients" className='block group'>
                    <div className='relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] h-64'>
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
                        
                        <div className='relative p-8 h-full flex flex-col justify-between'>
                            <div>
                                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-4xl">🧑</span>
                                </div>
                                <h2 className='text-3xl font-bold text-white mb-3'>Patient Records</h2>
                                <p className='text-green-100 text-lg'>Access patient medical history and information</p>
                            </div>
                            <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                <span>Open</span>
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* (TS) 14. ใช้ Role enum ในการเช็คเงื่อนไข */}
                    {(userRole === Role.reception || userRole === Role.admin) && (
                        <>
                            <Link href="/dashboard/appointments/create" className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-gray-700">New Appointment</span>
                                </div>
                            </Link>
                            <Link href="/dashboard/patients/create" className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-gray-700">New Patient</span>
                                </div>
                            </Link>
                        </>
                    )}
                    <Link href="/dashboard/appointments" className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-gray-700">Search Records</span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    </div>
  )
}

export default DashboardPage;