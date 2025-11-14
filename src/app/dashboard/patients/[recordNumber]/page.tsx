// src/app/dashboard/patients/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; 
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

interface PatientDetail {
    id: number;
    recordNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    allergies: string | null;
    medicalHistory: string | null;
    currentMedications: string | null;
}

interface AppointmentHistory {
    recordNumber: string;
    startTime: string;
    status: AppointmentStatus;
    doctorUsername: string | null;
}

function PatientDetailPage() {
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;
    
    const router = useRouter(); 
    const { data: session, status: sessionStatus } = useSession();
    const userRole = session?.user?.role;

    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [appointments, setAppointments] = useState<AppointmentHistory[]>([]); 
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                const patientResponse = await fetch(`http://localhost:3000/api/patients/${recordNumber}`);
                if (!patientResponse.ok) {
                    if (patientResponse.status === 404) {
                         setPatient(null);
                         throw new Error(`Patient record ${recordNumber} not found.`);
                    }
                    throw new Error(`Failed to fetch patient details: ${patientResponse.statusText}`);
                }
                const patientData: PatientDetail = await patientResponse.json();
                setPatient(patientData);
                
                const appointmentResponse = await fetch(`http://localhost:3000/api/patients/${recordNumber}/appointments`);
                if (!appointmentResponse.ok) {
                    if (appointmentResponse.status !== 404) {
                        throw new Error(`Failed to fetch appointments: ${appointmentResponse.statusText}`);
                    }
                    setAppointments([]);
                } else {
                    const appointmentData: { appointments: AppointmentHistory[] } = await appointmentResponse.json();
                    if (Array.isArray(appointmentData.appointments)) {
                        setAppointments(appointmentData.appointments); 
                    } else {
                        setAppointments([]);
                    }
                }

            } catch (err: any) {
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>
                <Navbar />
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10'>
                    <div className="text-center py-16">
                        <div className="inline-block relative">
                            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                        </div>
                        <p className="text-gray-600 mt-6 font-medium text-lg">Loading patient details...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>
                <Navbar />
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl relative z-10'>
                    <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Patients
                    </Link>
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-8 text-center backdrop-blur-sm shadow-xl">
                        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold text-red-700 mb-2'>Error Loading Patient</h2>
                        <p className="text-red-600 font-semibold">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>
                <Navbar />
                <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl relative z-10'>
                    <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Patients
                    </Link>
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-3xl p-8 text-center backdrop-blur-sm shadow-xl">
                        <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-yellow-700 font-semibold text-lg">Patient record <span className='font-mono'>({recordNumber})</span> not found.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const canEditPatient = userRole === Role.reception || userRole === Role.admin;

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <Navbar />
            
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl relative z-10'>
                <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Patients
                </Link>
                
                {/* Header Section */}
                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-10 animate-fade-in-down'>
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                            <span className="text-white font-black text-3xl">{patient.firstName[0]}{patient.lastName[0]}</span>
                        </div>
                        <div>
                            <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'>{patient.firstName} {patient.lastName}</h1>
                            <p className="text-lg text-gray-700 font-semibold">Record No: <span className="font-mono font-bold text-indigo-600">{patient.recordNumber}</span></p>
                        </div>
                    </div>
                    
                    {canEditPatient && (
                        <button 
                            onClick={() => router.push(`/dashboard/patients/edit/${patient.recordNumber}`)}
                            className='group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 font-black text-lg hover:scale-105 relative overflow-hidden'
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="relative z-10">Edit Record</span>
                        </button>
                    )}
                </div>

                {/* Basic Information Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-black text-gray-900'>Basic Information</h2>
                    </div>
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-indigo-100 shadow-lg">
                            <p className='text-sm font-bold text-gray-600 uppercase mb-2'>Date of Birth</p>
                            <p className='text-xl font-black text-gray-900'>{formatDate(patient.dateOfBirth)}</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-100 shadow-lg">
                            <p className='text-sm font-bold text-gray-600 uppercase mb-2'>Gender</p>
                            <p className='text-xl font-black text-gray-900 capitalize'>{patient.gender}</p>
                        </div>
                    </div>
                </div>

                {/* Medical Information Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-8 animate-fade-in animation-delay-200">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gradient-to-r from-green-200 to-emerald-200">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-black text-gray-900'>Medical Information</h2>
                    </div>

                    <div className='space-y-6'>
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border-2 border-red-200 shadow-lg">
                            <p className='text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2'>
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Allergies
                            </p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed font-medium'>{patient.allergies || <span className="text-gray-400 italic">None recorded</span>}</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                            <p className='text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2'>
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Medical History
                            </p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed font-medium'>{patient.medicalHistory || <span className="text-gray-400 italic">No history recorded</span>}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200 shadow-lg">
                            <p className='text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2'>
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                Current Medications
                            </p>
                            <p className='text-base text-gray-800 whitespace-pre-wrap leading-relaxed font-medium'>{patient.currentMedications || <span className="text-gray-400 italic">No current medications</span>}</p>
                        </div>
                    </div>
                </div>
                
                {/* Appointment History Section */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gradient-to-r from-blue-200 to-indigo-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className='text-2xl font-black text-gray-900'>Appointment History</h2>
                        </div>
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-black shadow-lg">
                            {appointments.length} {appointments.length === 1 ? 'Appointment' : 'Appointments'}
                        </span>
                    </div>

                    {appointments.length === 0 ? (
                        <div className='bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center'>
                            <div className="bg-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className='text-gray-600 text-lg font-semibold'>No appointment history found for this patient</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Appointment No.</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Time Slot</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Clinician</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
                                        {appointments.map((apt) => (
                                            <tr 
                                                key={apt.recordNumber} 
                                                onClick={() => handleRowClick(apt.recordNumber)}
                                                className="cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 transition-all duration-300 group transform hover:scale-[1.01]" 
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-purple-600">{apt.recordNumber}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-600 font-semibold">{formatDateTime(apt.startTime).split('|')[1].trim()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-8 h-8 rounded-xl flex items-center justify-center mr-2">
                                                            <span className="text-white font-bold text-xs">{apt.doctorUsername?.[0]?.toUpperCase() || 'N'}</span>
                                                        </div>
                                                        <span className="text-sm text-gray-700 font-semibold">{apt.doctorUsername || 'N/A'}</span>
                                                    </div>
                                                </td>
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
                .animate-fade-in-down {
                    animation: fade-in-down 0.8s ease-out;
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out 0.2s both;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out 0.3s both;
                }
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }
            `}</style>
        </div>
    );
}

export default PatientDetailPage;