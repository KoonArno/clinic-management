// src/app/dashboard/appointments/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation'; 
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

interface AppointmentDetail {
    recordNumber: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    notesReception: string | null;
    notesDoctor: string | null;
    patientDetails: {
        id: number;
        recordNumber: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: string;
    };
    doctorDetails: {
        id: number;
        username: string;
        fullName: string; // <--- (1) เพิ่ม fullName ที่นี่
    };
    createdByDetails: {
        id: number;
        username: string;
        fullName: string; // <--- (1) และเพิ่ม fullName ที่นี่
    };
}

function AppointmentDetailPage() {
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;
    
    const { data: session, status: sessionStatus } = useSession();
    
    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const formatDateTime = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ' | ' + 
                   date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return "Invalid Date"; }
    };

    const formatDateOnly = (dateString: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return "Invalid Date"; }
    };

    // (2) เพิ่มฟังก์ชันดึงอักษรย่อจาก FullName
    const getInitials = (fullName: string | undefined | null): string => {
        if (!fullName) return '?';
        try {
            const parts = fullName.split(' ');
            if (parts.length > 1) {
                return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
            }
            return (parts[0][0] || '?').toUpperCase();
        } catch {
            return '?';
        }
    }

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
                    const data: AppointmentDetail = await response.json();
                    setAppointment(data);
                }
            } catch (err: any) {
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="inline-block relative">
                            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                        </div>
                        <p className="text-gray-700 mt-6 font-semibold text-xl">Loading appointment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-2xl mx-auto bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-12 text-center backdrop-blur-sm">
                        <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Appointment</h2>
                        <p className="text-red-600 text-lg">{error || "Appointment not found"}</p>
                        <Link href="/dashboard/appointments" className="inline-block mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all">
                            Back to Appointments
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    
    const { patientDetails, doctorDetails, createdByDetails } = appointment;
    const patientFullName = `${patientDetails.firstName} ${patientDetails.lastName}`;
    
    const userRole = session?.user?.role;
    const buttonText = userRole === Role.clinician ? 'Update Status' : 'Edit Appointment'; 
    
    const canEdit = userRole === Role.admin || 
                    userRole === Role.reception || 
                    (userRole === Role.clinician && doctorDetails.id === session?.user?.id);

    const getStatusBadge = (status: AppointmentStatus): React.JSX.Element => {
        const styles: Record<AppointmentStatus, string> = {
            [AppointmentStatus.PENDING]: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30',
            [AppointmentStatus.COMPLETED]: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30',
        };
        return (
            <span className={`inline-flex items-center px-5 py-2 rounded-xl text-sm font-bold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <Navbar />
            
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl relative z-10'>
                <Link href="/dashboard/appointments" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to All Appointments
                </Link>
                
                {/* Header Section */}
                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-10 animate-fade-in-down'>
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                            <span className="text-5xl">📅</span>
                        </div>
                        <div>
                            <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2'>
                                Appointment Detail
                            </h1>
                            <p className="text-xl text-gray-700 font-semibold">
                                Record No: <span className="font-mono font-black text-indigo-600">{appointment.recordNumber}</span>
                            </p>
                        </div>
                    </div>
                    
                    {canEdit && (
                        <Link 
                            href={`/dashboard/appointments/edit/${appointment.recordNumber}`} 
                            className='group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 font-black text-lg hover:scale-105 relative overflow-hidden'
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="relative z-10">{buttonText}</span>
                        </Link>
                    )}
                </div>
                
                {/* Schedule Information Card */}
                <div className='bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-8 animate-fade-in'>
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-gradient-to-r from-blue-200 to-purple-200">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className='text-3xl font-black text-gray-900'>Schedule Information</h2>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Status</p>
                            <div>{getStatusBadge(appointment.status)}</div>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Assigned Clinician</p>
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center">
                                    {/* (3) ใช้อักษรย่อจาก fullName */}
                                    <span className="text-white font-bold text-lg">{getInitials(doctorDetails.fullName)}</span>
                                </div>
                                {/* (3) แสดง fullName แทน username */}
                                <p className='text-xl font-bold text-gray-900'>{doctorDetails.fullName}</p>
                            </div>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Start Time</p>
                            <p className='text-xl font-bold text-gray-900'>{formatDateTime(appointment.startTime)}</p>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>End Time</p>
                            <p className='text-xl font-bold text-gray-900'>{formatDateTime(appointment.endTime)}</p>
                        </div>
                    </div>
                </div>

                {/* Patient Details Card */}
                <div className='bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-8 animate-fade-in' style={{animationDelay: '0.1s'}}>
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-gradient-to-r from-green-200 to-emerald-200">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className='text-3xl font-black text-gray-900'>Patient Details</h2>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Patient Name</p>
                            <Link 
                                href={`/dashboard/patients/${patientDetails.recordNumber}`}
                                className="text-xl font-bold text-blue-600 hover:text-purple-600 flex items-center gap-2 group"
                            >
                                <span>{patientFullName}</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </Link>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Patient Record No.</p>
                            <p className='text-xl font-bold text-gray-900 font-mono'>{patientDetails.recordNumber}</p>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Date of Birth</p>
                            <p className='text-xl font-bold text-gray-900'>{formatDateOnly(patientDetails.dateOfBirth)}</p>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Gender</p>
                            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-base font-bold capitalize shadow-md
                                ${patientDetails.gender === 'male' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 
                                  patientDetails.gender === 'female' ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white' : 
                                  'bg-gray-200 text-gray-800'}`}>
                                {patientDetails.gender}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Administrative Details Card */}
                <div className='bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-fade-in' style={{animationDelay: '0.2s'}}>
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-gradient-to-r from-purple-200 to-pink-200">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className='text-3xl font-black text-gray-900'>Administrative Details</h2>
                    </div>
                    
                    <div className='space-y-6'>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Created By</p>
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-10 h-10 rounded-xl flex items-center justify-center">
                                    {/* (3) ใช้อักษรย่อจาก fullName */}
                                    <span className="text-white font-bold text-lg">{getInitials(createdByDetails.fullName)}</span>
                                </div>
                                {/* (3) แสดง fullName แทน username */}
                                <p className='text-xl font-bold text-gray-900'>{createdByDetails.fullName}</p>
                            </div>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Reception Notes</p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed font-medium'>
                                {appointment.notesReception || <span className="text-gray-400 italic">No notes provided</span>}
                            </p>
                        </div>
                        <div className="group bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg">
                            <p className='text-sm font-black text-gray-500 uppercase tracking-wider mb-3'>Clinician Notes</p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed font-medium'>
                                {appointment.notesDoctor || <span className="text-gray-400 italic">No notes provided</span>}
                            </p>
                        </div>
                    </div>
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
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out both;
                }
            `}</style>
        </div>
    );
}

export default AppointmentDetailPage;