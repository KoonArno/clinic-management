// src/app/dashboard/appointments/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';
import { config } from '@/lib/config';
import ClientDate from '@/app/components/ClientDate';

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
        fullName: string;
    };
    createdByDetails: {
        id: number;
        username: string;
        fullName: string;
    };
}

function AppointmentDetailPage() {
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;

    const { data: session, status: sessionStatus } = useSession();

    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                const response = await fetch(`${config.apiBaseUrl}/api/appointments/${recordNumber}`);
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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block relative">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-500 mt-4 font-medium">Loading appointment details...</p>
                </div>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Appointment</h2>
                    <p className="text-red-600 mb-6">{error || "Appointment not found"}</p>
                    <Link href="/dashboard/appointments" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                        Back to Appointments
                    </Link>
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
            [AppointmentStatus.PENDING]: 'bg-amber-100 text-amber-800 border border-amber-200',
            [AppointmentStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className='max-w-6xl mx-auto'>
            <Link href="/dashboard/appointments" className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-slate-100'>
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Back to All Appointments
            </Link>

            {/* Header Section */}
            <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8 animate-fade-in-down'>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                        <span className="text-3xl">📅</span>
                    </div>
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900 mb-1'>
                            Appointment Detail
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Record No: <span className="font-mono font-bold text-slate-700">{appointment.recordNumber}</span>
                        </p>
                    </div>
                </div>

                {canEdit && (
                    <Link
                        href={`/dashboard/appointments/edit/${appointment.recordNumber}`}
                        className='inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-200 font-bold text-base'
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>{buttonText}</span>
                    </Link>
                )}
            </div>

            {/* Schedule Information Card */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 animate-fade-in'>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className='text-xl font-bold text-slate-900'>Schedule Information</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Status</p>
                        <div>{getStatusBadge(appointment.status)}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Assigned Clinician</p>
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                                {getInitials(doctorDetails.fullName)}
                            </div>
                            <p className='text-base font-bold text-slate-900'>{doctorDetails.fullName}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Start Time</p>
                        <p className='text-base font-semibold text-slate-900'>
                            <ClientDate date={appointment.startTime} options={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }} />
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>End Time</p>
                        <p className='text-base font-semibold text-slate-900'>
                            <ClientDate date={appointment.endTime} options={{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }} />
                        </p>
                    </div>
                </div>
            </div>

            {/* Patient Details Card */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 animate-fade-in' style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className='text-xl font-bold text-slate-900'>Patient Details</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Patient Name</p>
                        <Link
                            href={`/dashboard/patients/${patientDetails.recordNumber}`}
                            className="text-lg font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-2 group"
                        >
                            <span>{patientFullName}</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </Link>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Patient Record No.</p>
                        <p className='text-lg font-bold text-slate-900 font-mono'>{patientDetails.recordNumber}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Date of Birth</p>
                        <p className='text-base font-semibold text-slate-900'>
                            <ClientDate date={patientDetails.dateOfBirth} options={{ year: 'numeric', month: 'long', day: 'numeric' }} />
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Gender</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
                            ${patientDetails.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                                patientDetails.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                                    'bg-slate-200 text-slate-800'}`}>
                            {patientDetails.gender}
                        </span>
                    </div>
                </div>
            </div>

            {/* Administrative Details Card */}
            <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fade-in' style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className='text-xl font-bold text-slate-900'>Administrative Details</h2>
                </div>

                <div className='space-y-6'>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Created By</p>
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center text-purple-700 font-bold text-xs">
                                {getInitials(createdByDetails.fullName)}
                            </div>
                            <p className='text-base font-bold text-slate-900'>{createdByDetails.fullName}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Reception Notes</p>
                        <p className='text-base text-slate-700 whitespace-pre-wrap leading-relaxed'>
                            {appointment.notesReception || <span className="text-slate-400 italic">No notes provided</span>}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Clinician Notes</p>
                        <p className='text-base text-slate-700 whitespace-pre-wrap leading-relaxed'>
                            {appointment.notesDoctor || <span className="text-slate-400 italic">No notes provided</span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppointmentDetailPage;