// src/app/dashboard/appointments/patient/[recordNumber]/page.tsx
"use client";

// (TS) 1. Import React และ Types/Enums
import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { AppointmentStatus } from '@prisma/client';

// (TS) 2. Interface สำหรับ Appointment (จาก API /api/patients/.../appointments)
interface AppointmentData {
    recordNumber: string;
    startTime: string; // ISO String
    endTime: string; // ISO String
    status: AppointmentStatus;
    doctorUsername: string | null;
}

// (TS) 3. Interface สำหรับข้อมูล Patient (จาก API เดียวกัน)
interface PatientInfo {
    name: string;
    recordNumber: string;
}

// (TS) 4. Interface สำหรับ State (ที่เก็บข้อมูลจาก API)
interface PageData {
    appointments: AppointmentData[];
    patient: PatientInfo | null;
}

// (TS) 5. Interface สำหรับ Props (Next.js จะส่ง params มาให้)
interface PatientAppointmentsPageProps {
    params: {
        recordNumber: string;
    }
}

// (TS) 6. ใช้ Interface กับ Props
function PatientAppointmentsPage({ params }: PatientAppointmentsPageProps) {
    const patientRecordNumber = params.recordNumber;
    
    // (TS) 7. กำหนด Type ให้ State
    const [data, setData] = useState<PageData>({ appointments: [], patient: null });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!patientRecordNumber || typeof patientRecordNumber !== 'string') {
            setError("Invalid Patient Record Number in URL.");
            setIsLoading(false);
            return;
        }

        async function fetchAppointments() {
            try {
                const url = `http://localhost:3000/api/patients/${patientRecordNumber}/appointments`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch appointments for patient ${patientRecordNumber}`);
                }
                // (TS) 8. กำหนด Type ให้ result
                const result: PageData = await response.json();
                
                setData(result);
            } catch (err: any) { // (TS) 9. Type error
                console.error("Fetching error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchAppointments();
    }, [patientRecordNumber]);

    // (TS) 10. กำหนด Type parameter (อนุญาต null)
    const formatDateTime = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' | ' + 
                   date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return "Invalid Date";
        }
    };

    // (TS) 11. กำหนด Type return
    const renderTableContent = (): React.JSX.Element => {
        if (isLoading) {
            return (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-4">Loading patient's appointments...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            );
        }

        if (data.appointments.length === 0) {
            return (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <p className="text-gray-600 text-lg">No appointments found for this patient.</p>
                </div>
            );
        }

        return (
            <div className="overflow-hidden bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Apt. No.</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time Slot</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Clinician</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {data.appointments.map((apt) => (
                                <tr key={apt.recordNumber} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition duration-200 group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-mono font-semibold text-blue-600">{apt.recordNumber}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{formatDateTime(apt.startTime).split('|')[0].trim()}</span>
                                            <span className="text-xs text-gray-500">
                                                {formatDateTime(apt.startTime).split('|')[1].trim()} - {formatDateTime(apt.endTime).split('|')[1].trim()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{apt.doctorUsername}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {/* (TS) 12. ใช้ enum ในการเทียบ */}
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                            apt.status === AppointmentStatus.PENDING ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                                            : apt.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-800 border-green-200' 
                                            : 'bg-red-100 text-red-800 border-red-200'}`
                                        }>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link 
                                            href={`/dashboard/appointments/edit/${apt.recordNumber}`} 
                                            className="text-indigo-600 hover:text-indigo-900 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const patientTitle = data.patient ? `${data.patient.name} (${data.patient.recordNumber})` : patientRecordNumber;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                <Link href="/dashboard/appointments" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to All Appointments
                </Link>
                
                <h1 className='text-3xl font-bold text-gray-800 mb-6'>
                    Appointment History for Patient: <span className='text-indigo-600'>{patientTitle}</span>
                </h1>
                
                <div className="mt-8">
                    {renderTableContent()}
                </div>
            </div>
        </div>
    );
}

export default PatientAppointmentsPage;