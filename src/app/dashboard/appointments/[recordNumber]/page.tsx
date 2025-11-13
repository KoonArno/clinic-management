// src/app/dashboard/appointments/[recordNumber]/page.tsx
"use client";

// (TS) 1. Import React และ Types/Enums
import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation'; 
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

// (TS) 2. สร้าง Interface สำหรับข้อมูล Appointment ที่ดึงมาจาก API
// (อ้างอิงจาก API /api/appointments/[recordNumber] ที่เราสร้าง)
interface AppointmentDetail {
    recordNumber: string;
    startTime: string; // ISO String
    endTime: string; // ISO String
    status: AppointmentStatus;
    notesReception: string | null;
    notesDoctor: string | null;
    patientDetails: {
        id: number;
        recordNumber: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string; // ISO String
        gender: string;
    };
    doctorDetails: {
        id: number;
        username: string;
    };
    createdByDetails: {
        id: number;
        username: string;
    };
}

function AppointmentDetailPage() {
    // (TS) 3. กำหนด Type ให้ params
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;
    
    const { data: session, status: sessionStatus } = useSession();
    
    // (TS) 4. กำหนด Type ให้ State
    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // (TS) 5. กำหนด Type parameter (อนุญาต null)
    const formatDateTime = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' | ' + 
                   date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return "Invalid Date"; }
    };

    // (TS) 6. กำหนด Type parameter (อนุญาต null)
    const formatDateOnly = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return "Invalid Date"; }
    };

    useEffect(() => {
        if (!recordNumber || sessionStatus !== "authenticated") {
            if (sessionStatus === "loading") setIsLoading(true);
            else setError("Please log in to view appointment details.");
            return;
        }

        async function fetchAppointmentDetails() {
            try {
                const response = await fetch(`http://localhost:3000/api/appointments/${recordNumber}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch appointment: ${response.statusText}`);
                } else {
                    // (TS) 7. กำหนด Type data
                    const data: AppointmentDetail = await response.json();
                    setAppointment(data);
                }
            } catch (err: any) { // (TS) 8. Type error
                console.error("Fetching error:", err);
                setError(err.message || "Failed to load appointment details.");
                setAppointment(null);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchAppointmentDetails();
    }, [recordNumber, sessionStatus]);

    if (isLoading || sessionStatus === "loading") {
        return (
            <div className="min-h-screen ...">
                {/* ... (Loading) ... */}
            </div>
        );
    }

    if (error || !appointment) { // (TS) 9. เช็ค error หรือ appointment เป็น null
        return (
            <div className="min-h-screen ...">
                {/* ... (Error or Not Found) ... */}
            </div>
        );
    }
    
    // (TS) 10. ตั้งแต่จุดนี้ 'appointment' ไม่ใช่ null แล้ว
    const { patientDetails, doctorDetails, createdByDetails } = appointment;
    const patientFullName = `${patientDetails.firstName} ${patientDetails.lastName}`;
    
    const userRole = session?.user?.role;
    // (TS) 11. ใช้ Role enum
    const buttonText = userRole === Role.clinician ? 'Update Status' : 'Edit Appointment'; 
    
    // (TS) 12. ใช้ Role enum (session.user.id เป็น number)
    const canEdit = userRole === Role.admin || 
                    userRole === Role.reception || 
                    (userRole === Role.clinician && doctorDetails.id === session?.user?.id);

    // (TS) 13. กำหนด Type parameter
    const getStatusBadge = (status: AppointmentStatus): React.JSX.Element => {
        // (TS) 14. ใช้ Record + enum
        const styles: Record<AppointmentStatus, string> = {
            [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            [AppointmentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
        };
        return (
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl'>
                <Link href="/dashboard/appointments" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to All Appointments
                </Link>
                
                {/* Header Section (เหมือนเดิม) */}
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8'>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-4xl">📅</span>
                            </div>
                            <div>
                                <h1 className='text-4xl font-bold text-gray-900'>Appointment Detail</h1>
                                <p className="text-lg text-gray-600">Record No: <span className="font-mono font-semibold text-indigo-600">{appointment.recordNumber}</span></p>
                            </div>
                        </div>
                    </div>
                    
                    {canEdit && (
                        <Link 
                            href={`/dashboard/appointments/edit/${appointment.recordNumber}`} 
                            className='inline-flex items-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 font-semibold group'
                        >
                            <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {buttonText}
                        </Link>
                    )}
                </div>
                
                {/* Schedule Information Card */}
                <div className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6'>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-900'>Schedule Information</h2>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Status</p>
                            <div>{getStatusBadge(appointment.status)}</div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Assigned Clinician</p>
                            <p className='text-xl font-semibold text-gray-900'>{doctorDetails.username}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Start Time</p>
                            <p className='text-xl font-semibold text-gray-900'>{formatDateTime(appointment.startTime)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>End Time</p>
                            <p className='text-xl font-semibold text-gray-900'>{formatDateTime(appointment.endTime)}</p>
                        </div>
                    </div>
                </div>

                {/* Patient Details Card */}
                <div className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6'>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                        <div className="bg-green-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-900'>Patient Details</h2>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Patient Name</p>
                            <Link 
                                href={`/dashboard/patients/${patientDetails.recordNumber}`}
                                className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                            >
                                {patientFullName}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </Link>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Patient Record No.</p>
                            <p className='text-xl font-semibold text-gray-900 font-mono'>{patientDetails.recordNumber}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Date of Birth</p>
                            <p className='text-xl font-semibold text-gray-900'>{formatDateOnly(patientDetails.dateOfBirth)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Gender</p>
                            <p className='text-xl font-semibold text-gray-900 capitalize'>{patientDetails.gender}</p>
                        </div>
                    </div>
                </div>

                {/* Administrative Details Card */}
                <div className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8'>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                        <div className="bg-purple-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-900'>Administrative Details</h2>
                    </div>
                    
                    <div className='space-y-6'>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Created By</p>
                            <p className='text-xl font-semibold text-gray-900'>{createdByDetails.username}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Reception Notes</p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed'>{appointment.notesReception || <span className="text-gray-400 italic">No notes provided</span>}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Clinician Notes</p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed'>{appointment.notesDoctor || <span className="text-gray-400 italic">No notes provided</span>}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppointmentDetailPage;