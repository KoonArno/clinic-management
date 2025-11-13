// src/app/dashboard/patients/[recordNumber]/page.tsx
"use client";

// (TS) 1. Import React และ Types/Enums
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; 
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

// (TS) 2. Interface สำหรับข้อมูล Patient (ที่ดึงจาก API /api/patients/[recordNumber])
interface PatientDetail {
    id: number;
    recordNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string; // ISO String
    allergies: string | null;
    medicalHistory: string | null;
    currentMedications: string | null;
}

// (TS) 3. Interface สำหรับข้อมูล Appointment (ที่ดึงจาก API .../[recordNumber]/appointments)
interface AppointmentHistory {
    recordNumber: string;
    startTime: string; // ISO String
    status: AppointmentStatus; // (TS) 4. ใช้ enum
    doctorUsername: string | null; // (TS) 5. API ส่ง doctorUsername (ตามไฟล์ .js)
}

function PatientDetailPage() {
    // (TS) 6. useParams จะ return Type เป็น object, เรา cast เป็น Type ที่เรารู้จัก
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;
    
    const router = useRouter(); 
    const { data: session, status: sessionStatus } = useSession();
    const userRole = session?.user?.role;

    // (TS) 7. กำหนด Type ให้ State
    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [appointments, setAppointments] = useState<AppointmentHistory[]>([]); 
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // (TS) 8. กำหนด Type parameter 'aptRecordNumber'
    const handleRowClick = useCallback((aptRecordNumber: string) => {
        if (aptRecordNumber) {
            router.push(`/dashboard/appointments/${aptRecordNumber}`);
        }
    }, [router]);

    useEffect(() => {
        if (!recordNumber || sessionStatus !== "authenticated") {
            if (sessionStatus === "loading") {
                setIsLoading(true);
            } else {
                setIsLoading(false);
                setError("Please log in to view patient details.");
            }
            return;
        }

        async function fetchPatientDetailAndAppointments() {
            try {
                // Fetch Patient Details
                const patientResponse = await fetch(`http://localhost:3000/api/patients/${recordNumber}`);
                if (!patientResponse.ok) {
                    if (patientResponse.status === 404) {
                         setPatient(null);
                         throw new Error(`Patient record ${recordNumber} not found.`);
                    }
                    throw new Error(`Failed to fetch patient details: ${patientResponse.statusText}`);
                }
                // (TS) 9. กำหนด Type ให้ data ที่รับมา
                const patientData: PatientDetail = await patientResponse.json();
                setPatient(patientData);
                
                // Fetch Appointments
                const appointmentResponse = await fetch(`http://localhost:3000/api/patients/${recordNumber}/appointments`);
                if (!appointmentResponse.ok) {
                    if (appointmentResponse.status !== 404) {
                        throw new Error(`Failed to fetch appointments: ${appointmentResponse.statusText}`);
                    }
                    setAppointments([]);
                } else {
                    // (TS) 10. API นี้ส่งกลับมาเป็น { appointments: [...] }
                    const appointmentData: { appointments: AppointmentHistory[] } = await appointmentResponse.json();
                    if (Array.isArray(appointmentData.appointments)) {
                        setAppointments(appointmentData.appointments); 
                    } else {
                        setAppointments([]);
                    }
                }

            } catch (err: any) { // (TS) 11. Type error
                console.error("Fetching detail error:", err);
                setError(err.message.includes('not found') 
                    ? "Patient record not found or server error."
                    : "Failed to load patient or appointment data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchPatientDetailAndAppointments();
    }, [recordNumber, sessionStatus]);

    // (TS) 12. กำหนด Type parameter (อนุญาต null)
    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return 'Invalid Date';
        }
    };
    
    // (TS) 13. กำหนด Type parameter (อนุญาต null)
    const formatDateTime = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date/Time';
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
                   + ' | ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return 'Invalid Date/Time';
        }
    };

    if (isLoading || sessionStatus === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <Navbar />
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading patient details...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <Navbar />
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl'>
                    <Link href="/dashboard/patients" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Patients
                    </Link>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className='text-2xl font-bold text-red-700 mb-2'>Error Loading Patient</h2>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) { // (TS) 14. เช็คว่า patient (ที่ Type เป็น PatientDetail | null) ไม่ใช่ null
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <Navbar />
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl'>
                    <Link href="/dashboard/patients" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Patients
                    </Link>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                        <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-yellow-700 font-semibold text-lg">Patient record <span className='font-mono'>({recordNumber})</span> not found.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // (TS) 15. ใช้ Role enum
    const canEditPatient = userRole === Role.reception || userRole === Role.admin;

    // (TS) 16. กำหนด Type parameter เป็น AppointmentStatus
    const getStatusBadge = (status: AppointmentStatus): React.JSX.Element => {
        // (TS) 17. ใช้ Record และ enum เป็น key
        const styles: Record<AppointmentStatus, string> = {
            [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            [AppointmentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl'>
                <Link href="/dashboard/patients" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Patients
                </Link>
                
                {/* Header Section */}
                {/* (TS) 18. ตั้งแต่จุดนี้ 'patient' ไม่ใช่ null แล้ว */}
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8'>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-2xl">{patient.firstName[0]}{patient.lastName[0]}</span>
                            </div>
                            <div>
                                <h1 className='text-4xl font-bold text-gray-900'>{patient.firstName} {patient.lastName}</h1>
                                <p className="text-lg text-gray-600">Record No: <span className="font-mono font-semibold text-indigo-600">{patient.recordNumber}</span></p>
                            </div>
                        </div>
                    </div>
                    
                    {canEditPatient && (
                        <button 
                            onClick={() => router.push(`/dashboard/patients/edit/${patient.recordNumber}`)}
                            className='inline-flex items-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 font-semibold group'
                        >
                            <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Record
                        </button>
                    )}
                </div>

                {/* Basic Information Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-900'>Basic Information</h2>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Date of Birth</p>
                            <p className='text-xl font-semibold text-gray-900'>{formatDate(patient.dateOfBirth)}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                            <p className='text-sm font-semibold text-gray-500 uppercase mb-2'>Gender</p>
                            <p className='text-xl font-semibold text-gray-900 capitalize'>{patient.gender}</p>
                        </div>
                    </div>
                </div>

                {/* Medical Information Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                        <div className="bg-green-100 p-3 rounded-xl">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-900'>Medical Information</h2>
                    </div>

                    <div className='space-y-6'>
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-5 rounded-xl border border-red-200">
                            <p className='text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2'>
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Allergies
                            </p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed'>{patient.allergies || <span className="text-gray-400 italic">None recorded</span>}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                            <p className='text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2'>
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Medical History
                            </p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed'>{patient.medicalHistory || <span className="text-gray-400 italic">No history recorded</span>}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
                            <p className='text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2'>
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                Current Medications
                            </p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed'>{patient.currentMedications || <span className="text-gray-400 italic">No current medications</span>}</p>
                        </div>
                    </div>
                </div>
                
                {/* Appointment History Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className='text-2xl font-bold text-gray-900'>Appointment History</h2>
                        </div>
                        <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold">
                            {appointments.length} {appointments.length === 1 ? 'Appointment' : 'Appointments'}
                        </span>
                    </div>

                    {appointments.length === 0 ? (
                        <div className='bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center'>
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className='text-gray-600 text-lg'>No appointment history found for this patient</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Appointment No.</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time Slot</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Clinician</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {/* (TS) 19. 'apt' มี Type เป็น AppointmentHistory */}
                                        {appointments.map((apt) => (
                                            <tr 
                                                key={apt.recordNumber} 
                                                onClick={() => handleRowClick(apt.recordNumber)}
                                                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition duration-200 group" 
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono font-semibold text-blue-600 group-hover:text-blue-700">{apt.recordNumber}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{formatDateTime(apt.startTime).split('|')[0].trim()}</span>
                                                        <span className="text-xs text-gray-500">{formatDateTime(apt.startTime).split('|')[1].trim()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{apt.doctorUsername || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(apt.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PatientDetailPage;