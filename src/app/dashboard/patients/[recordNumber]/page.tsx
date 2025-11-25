// src/app/dashboard/patients/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';
import { config } from '@/lib/config';
import ClientDate from '@/app/components/ClientDate';

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
                const patientResponse = await fetch(`${config.apiBaseUrl}/api/patients/${recordNumber}`);
                if (!patientResponse.ok) {
                    if (patientResponse.status === 404) {
                        setPatient(null);
                        throw new Error(`Patient record ${recordNumber} not found.`);
                    }
                    throw new Error(`Failed to fetch patient details: ${patientResponse.statusText}`);
                }
                const patientData: PatientDetail = await patientResponse.json();
                setPatient(patientData);

                const appointmentResponse = await fetch(`${config.apiBaseUrl}/api/patients/${recordNumber}/appointments`);
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

    if (isLoading || sessionStatus === "loading") {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block relative">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-500 mt-4 font-medium">Loading patient details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='max-w-5xl mx-auto'>
                <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-slate-100'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Patients
                </Link>
                <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-r-xl shadow-sm">
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className='text-2xl font-bold text-red-700 mb-2 text-center'>Error Loading Patient</h2>
                    <p className="text-red-600 font-medium text-center">{error}</p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className='max-w-5xl mx-auto'>
                <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-slate-100'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Patients
                </Link>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-8 rounded-r-xl shadow-sm">
                    <div className="flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-amber-700 font-medium text-lg text-center">Patient record <span className='font-mono font-bold'>({recordNumber})</span> not found.</p>
                </div>
            </div>
        );
    }

    const canEditPatient = userRole === Role.reception || userRole === Role.admin;

    const getStatusBadge = (status: AppointmentStatus): React.JSX.Element => {
        const styles: Record<AppointmentStatus, string> = {
            [AppointmentStatus.PENDING]: 'bg-amber-100 text-amber-800 border border-amber-200',
            [AppointmentStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className='max-w-5xl mx-auto'>
            <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-slate-100'>
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Patients
            </Link>

            {/* Header Section */}
            <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8 animate-fade-in-down'>
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-2xl">
                        {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900'>{patient.firstName} {patient.lastName}</h1>
                        <p className="text-slate-500 font-medium mt-1">Record No: <span className="font-mono font-bold text-slate-700">{patient.recordNumber}</span></p>
                    </div>
                </div>

                {canEditPatient && (
                    <button
                        onClick={() => router.push(`/dashboard/patients/edit/${patient.recordNumber}`)}
                        className='inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-200 font-bold text-sm'
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Record</span>
                    </button>
                )}
            </div>

            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className='text-lg font-bold text-slate-900'>Basic Information</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase mb-1'>Date of Birth</p>
                        <p className='text-lg font-bold text-slate-900'>
                            <ClientDate date={patient.dateOfBirth} options={{ year: 'numeric', month: 'long', day: 'numeric' }} />
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase mb-1'>Gender</p>
                        <p className='text-lg font-bold text-slate-900 capitalize'>{patient.gender}</p>
                    </div>
                </div>
            </div>

            {/* Medical Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className='text-lg font-bold text-slate-900'>Medical Information</h2>
                </div>

                <div className='space-y-4'>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2'>
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Allergies
                        </p>
                        <p className='text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium'>{patient.allergies || <span className="text-slate-400 italic">None recorded</span>}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2'>
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Medical History
                        </p>
                        <p className='text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium'>{patient.medicalHistory || <span className="text-slate-400 italic">No history recorded</span>}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2'>
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Current Medications
                        </p>
                        <p className='text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium'>{patient.currentMedications || <span className="text-slate-400 italic">No current medications</span>}</p>
                    </div>
                </div>
            </div>

            {/* Appointment History Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className='text-lg font-bold text-slate-900'>Appointment History</h2>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                        {appointments.length} {appointments.length === 1 ? 'Appointment' : 'Appointments'}
                    </span>
                </div>

                {appointments.length === 0 ? (
                    <div className='bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center'>
                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-sm">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className='text-slate-500 font-medium'>No appointment history found for this patient</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Appointment No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time Slot</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Clinician</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {appointments.map((apt) => (
                                        <tr
                                            key={apt.recordNumber}
                                            onClick={() => handleRowClick(apt.recordNumber)}
                                            className="cursor-pointer hover:bg-slate-50 transition-colors duration-150 group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-mono font-bold text-emerald-600 group-hover:text-emerald-700 group-hover:underline">{apt.recordNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-700 font-medium">
                                                        <ClientDate date={apt.startTime} options={{ hour: '2-digit', minute: '2-digit', hour12: true }} />
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-emerald-700 font-bold text-xs">
                                                        {apt.doctorUsername?.[0]?.toUpperCase() || 'N'}
                                                    </div>
                                                    <span className="text-sm text-slate-700 font-medium">{apt.doctorUsername || 'N/A'}</span>
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
    );
}

export default PatientDetailPage;