// src/app/dashboard/appointments/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';
import { config } from '@/lib/config';
import StatsCard from '@/app/components/StatsCard';
import StatusBadge from '@/app/components/StatusBadge';
import PageHeader from '@/app/components/PageHeader';
import SearchFilter from '@/app/components/SearchFilter';
import ClientDate from '@/app/components/ClientDate';

interface AppointmentData {
    recordNumber: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    patientName: string;
    patientRecordNumber: string;
    doctorFullName: string;
    createdByFullName: string;
    notesReception: string | null;
}

type StatusFilter = AppointmentStatus | 'ALL';

function AppointmentsPage() {
    const [appointments, setAppointments] = useState<AppointmentData[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<AppointmentData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    const { data: session, status } = useSession();
    const userRole = session?.user?.role;

    useEffect(() => {
        if (status === "authenticated") {
            async function fetchAppointments() {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/api/appointments`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch appointments: ${response.statusText}`);
                    }
                    const data: AppointmentData[] = await response.json();
                    setAppointments(data);
                    setFilteredAppointments(data);
                } catch (err: any) {
                    console.error("Fetching error:", err);
                    setError("Failed to load appointment data. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            }
            fetchAppointments();
        } else if (status === "loading") {
            setIsLoading(true);
        } else {
            setIsLoading(false);
            setError("Please log in to view appointment data.");
        }
    }, [status]);

    useEffect(() => {
        let filtered = appointments;

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.patientName.toLowerCase().includes(search) ||
                apt.patientRecordNumber.toLowerCase().includes(search) ||
                apt.doctorFullName.toLowerCase().includes(search) ||
                apt.recordNumber.toLowerCase().includes(search) ||
                apt.createdByFullName.toLowerCase().includes(search)
            );
        }

        setFilteredAppointments(filtered);
    }, [searchTerm, statusFilter, appointments]);

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

    const renderTableContent = (): React.JSX.Element => {
        if (isLoading || status === "loading") {
            return (
                <div className="text-center py-16">
                    <div className="inline-block relative">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-500 mt-4 font-medium">Loading appointments...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                </div>
            );
        }

        if (filteredAppointments.length === 0) {
            return (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center">
                    <p className="text-slate-500 font-medium">No appointments found.</p>
                </div>
            );
        }

        return (
            <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Apt. No.</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time Slot</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Clinician</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredAppointments.map((apt) => (
                                <tr key={apt.recordNumber} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/dashboard/appointments/${apt.recordNumber}`} className="text-sm font-mono font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                                            {apt.recordNumber}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Link href={`/dashboard/patients/${apt.patientRecordNumber}`} className="text-sm font-semibold text-slate-900 hover:text-emerald-600">
                                                {apt.patientName}
                                            </Link>
                                            <span className="text-xs text-slate-500 font-mono">{apt.patientRecordNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">
                                                <ClientDate date={apt.startTime} options={{ day: '2-digit', month: 'short', year: 'numeric' }} />
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                <ClientDate date={apt.startTime} options={{ hour: '2-digit', minute: '2-digit', hour12: true }} />
                                                {' - '}
                                                <ClientDate date={apt.endTime} options={{ hour: '2-digit', minute: '2-digit', hour12: true }} />
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-emerald-700 font-bold text-xs">
                                                {getInitials(apt.doctorFullName)}
                                            </div>
                                            <span className="text-sm text-slate-700 font-medium">{apt.doctorFullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={apt.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{apt.createdByFullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Link
                                            href={`/dashboard/appointments/${apt.recordNumber}`}
                                            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                                        >
                                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View
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

    const canCreateAppointment = userRole === Role.reception || userRole === Role.admin;

    const stats = {
        total: appointments.length,
        pending: appointments.filter(a => a.status === AppointmentStatus.PENDING).length,
        completed: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
        showing: filteredAppointments.length
    };

    return (
        <>
            <PageHeader
                title="Appointments"
                subtitle="Manage all scheduled appointments efficiently"
                icon="📅"
                actionButton={canCreateAppointment ? { label: "Create Appointment", href: "/dashboard/appointments/create" } : undefined}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                <StatsCard
                    title="Total Appointments"
                    value={stats.total}
                    subtitle="All time"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    iconBgFrom="from-blue-500"
                    iconBgTo="to-blue-600"
                    textColor="text-blue-600"
                />
                <StatsCard
                    title="Pending"
                    value={stats.pending}
                    subtitle="Awaiting action"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgFrom="from-amber-500"
                    iconBgTo="to-amber-600"
                    textColor="text-amber-600"
                />
                <StatsCard
                    title="Completed"
                    value={stats.completed}
                    subtitle="Successfully done"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                    iconBgFrom="from-emerald-500"
                    iconBgTo="to-emerald-600"
                    textColor="text-emerald-600"
                />
                <StatsCard
                    title="Showing Results"
                    value={stats.showing}
                    subtitle="Current view"
                    icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    iconBgFrom="from-purple-500"
                    iconBgTo="to-purple-600"
                    textColor="text-purple-600"
                />
            </div>

            <SearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={(value) => setStatusFilter(value as StatusFilter)}
                statusOptions={[
                    { value: 'ALL', label: 'All Status' },
                    { value: AppointmentStatus.PENDING, label: 'Pending' },
                    { value: AppointmentStatus.COMPLETED, label: 'Completed' },
                ]}
            />

            <div className="mt-6 animate-fade-in-up">
                {renderTableContent()}
            </div>
        </>
    );
}

export default AppointmentsPage;