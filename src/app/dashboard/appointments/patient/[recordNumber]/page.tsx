// src/app/dashboard/appointments/patient/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { AppointmentStatus } from '@prisma/client';

interface AppointmentData {
    recordNumber: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    doctorUsername: string | null;
}

interface PatientInfo {
    name: string;
    recordNumber: string;
}

interface PageData {
    appointments: AppointmentData[];
    patient: PatientInfo | null;
}

interface PatientAppointmentsPageProps {
    params: {
        recordNumber: string;
    }
}

function PatientAppointmentsPage({ params }: PatientAppointmentsPageProps) {
    const patientRecordNumber = params.recordNumber;
    
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
                const result: PageData = await response.json();
                
                setData(result);
            } catch (err: any) {
                console.error("Fetching error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchAppointments();
    }, [patientRecordNumber]);

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

    const getStatusBadge = (status: AppointmentStatus): React.JSX.Element => {
        const styles: Record<AppointmentStatus, string> = {
            [AppointmentStatus.PENDING]: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30',
            [AppointmentStatus.COMPLETED]: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const renderTableContent = (): React.JSX.Element => {
        if (isLoading) {
            return (
                <div className="text-center py-16">
                    <div className="inline-block relative">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                    </div>
                    <p className="text-gray-600 mt-6 font-medium text-lg">Loading patient's appointments...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-8 text-center backdrop-blur-sm">
                    <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-700 font-semibold text-lg">{error}</p>
                </div>
            );
        }

        if (data.appointments.length === 0) {
            return (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center backdrop-blur-sm">
                    <div className="bg-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-700 text-xl font-bold">No appointments found for this patient.</p>
                </div>
            );
        }

        return (
            <div className="overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                            <tr>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Apt. No.</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Time Slot</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Clinician</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
                            {data.appointments.map((apt) => (
                                <tr key={apt.recordNumber} className="hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 group transform hover:scale-[1.01]">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="text-sm font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{apt.recordNumber}</span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{formatDateTime(apt.startTime).split('|')[0].trim()}</span>
                                            <span className="text-xs text-gray-600 font-semibold">
                                                {formatDateTime(apt.startTime).split('|')[1].trim()} - {formatDateTime(apt.endTime).split('|')[1].trim()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-8 h-8 rounded-xl flex items-center justify-center">
                                                <span className="text-white font-bold text-xs">{apt.doctorUsername?.[0]?.toUpperCase() || '?'}</span>
                                            </div>
                                            <span className="text-sm text-gray-700 font-semibold">{apt.doctorUsername}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {getStatusBadge(apt.status)}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                        <Link 
                                            href={`/dashboard/appointments/${apt.recordNumber}`} 
                                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg group"
                                        >
                                            <span>View</span>
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                            </svg>
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <Navbar />
            
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10'>
                <Link href="/dashboard/appointments" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to All Appointments
                </Link>
                
                <div className="mb-10 animate-fade-in-down">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-5 rounded-3xl shadow-2xl">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h1 className='text-4xl font-black text-gray-900 mb-2'>
                                Appointment History
                            </h1>
                            <p className="text-xl font-bold">
                                Patient: <span className='bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'>{patientTitle}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="mb-8 animate-fade-in">
                    <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-indigo-200 inline-block">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-1">Total Appointments</p>
                                <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{data.appointments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 animate-fade-in-up">
                    {renderTableContent()}
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes fade-in-down {
                    0% {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fade-in {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.8s ease-out;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out 0.3s both;
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out 0.2s both;
                }
            `}</style>
        </div>
    );
}

export default PatientAppointmentsPage;