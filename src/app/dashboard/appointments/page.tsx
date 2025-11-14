// src/app/dashboard/appointments/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

// (1) Interface (เหมือนเดิม)
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

    // (ส่วน useEffects สำหรับ fetchAppointments และ filter เหมือนเดิม)
    useEffect(() => {
        if (status === "authenticated") {
            async function fetchAppointments() {
                try {
                    const response = await fetch("http://localhost:3000/api/appointments");
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

    // (Helper functions: formatDateTime, getInitials, getStatusBadge เหมือนเดิม)
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

    const getStatusBadge = (status: AppointmentStatus): React.JSX.Element => {
        const styles: Record<AppointmentStatus, string> = {
            [AppointmentStatus.PENDING]: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30',
            [AppointmentStatus.COMPLETED]: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30',
            // [AppointmentStatus.CANCELLED]: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
        };
        return (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };


    // (2) แก้ไข renderTableContent
    const renderTableContent = (): React.JSX.Element => {
        if (isLoading || status === "loading") {
            // (Loading UI...)
            return (
                <div className="text-center py-16">
                    <div className="inline-block relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                    </div>
                    <p className="text-gray-600 mt-6 font-medium text-lg">Loading appointments...</p>
                </div>
            );
        }
        
        if (error) {
            // (Error UI...)
            return (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-8 text-center backdrop-blur-sm">
                    {/* ... (โค้ด Error) ... */}
                </div>
            );
        }

        if (filteredAppointments.length === 0) {
            // (No results UI...)
            return (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center backdrop-blur-sm">
                    {/* ... (โค้ด No results) ... */}
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
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Time Slot</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Clinician</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Created By</th>
                                {/* (2) เพิ่มคอลัมน์ Action ใน <thead> */}
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-700 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
                            {filteredAppointments.map((apt) => (
                                <tr key={apt.recordNumber} className="hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 transition-all duration-300 group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {/* (หมายเหตุ: ลิงก์ที่ Apt. No. ถูกคงไว้ตามไฟล์เดิม) */}
                                        <Link href={`/dashboard/appointments/${apt.recordNumber}`} className="text-sm font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-indigo-600 hover:to-purple-600">
                                            {apt.recordNumber}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Link href={`/dashboard/patients/${apt.patientRecordNumber}`} className="text-sm font-bold text-gray-900 hover:text-indigo-700">
                                                {apt.patientName}
                                            </Link>
                                            <span className="text-xs text-gray-500 font-mono font-semibold">{apt.patientRecordNumber}</span>
                                        </div>
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
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-8 h-8 rounded-xl flex items-center justify-center mr-2">
                                                <span className="text-white font-bold text-xs">{getInitials(apt.doctorFullName)}</span>
                                            </div>
                                            <span className="text-sm text-gray-700 font-semibold">{apt.doctorFullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {getStatusBadge(apt.status)}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">{apt.createdByFullName}</td>

                                    {/* (2) เพิ่มปุ่ม View ใน <td> */}
                                    <td className="px-6 py-5 whitespace-nowrap text-right">
                                        <Link 
                                            href={`/dashboard/appointments/${apt.recordNumber}`} 
                                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <Navbar />
            
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10'>
                <Link href="/dashboard" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>
                
                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-10 animate-fade-in-down'>
                    <div>
                        <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-3 flex items-center gap-4'>
                            <span className="text-5xl">📅</span>
                            Appointments
                        </h1>
                        <p className="text-gray-700 text-lg font-semibold">Manage all scheduled appointments efficiently</p>
                    </div>
                    
                    {canCreateAppointment && (
                        <Link href="/dashboard/appointments/create" className='group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 font-black text-lg hover:scale-105 relative overflow-hidden'>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="relative z-10">Create Appointment</span>
                        </Link>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
                    <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-blue-200 hover:-translate-y-2 overflow-hidden">
                        {/* ... (โค้ด Stat Card 1) ... */}
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{stats.total}</span>
                            </div>
                            <p className="text-base font-bold text-gray-800">Total Appointments</p>
                            <p className="text-sm text-gray-600 font-medium">All time</p>
                        </div>
                    </div>

                    <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-amber-200 hover:-translate-y-2 overflow-hidden">
                        {/* ... (โค้ด Stat Card 2) ... */}
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-3 rounded-2xl shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600">{stats.pending}</span>
                            </div>
                            <p className="text-base font-bold text-gray-800">Pending</p>
                            <p className="text-sm text-gray-600 font-medium">Awaiting action</p>
                        </div>
                    </div>

                    <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-green-200 hover:-translate-y-2 overflow-hidden">
                        {/* ... (โค้ด Stat Card 3) ... */}
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">{stats.completed}</span>
                            </div>
                            <p className="text-base font-bold text-gray-800">Completed</p>
                            <p className="text-sm text-gray-600 font-medium">Successfully done</p>
                        </div>
                    </div>

                    <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-purple-200 hover:-translate-y-2 overflow-hidden">
                        {/* ... (โค้ด Stat Card 4) ... */}
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">{stats.showing}</span>
                            </div>
                            <p className="text-base font-bold text-gray-800">Showing Results</p>
                            <p className="text-sm text-gray-600 font-medium">Current view</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 mb-10 animate-fade-in">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="search" className="sr-only">Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by patient, clinician, or record no..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 shadow-lg transition-all font-semibold text-gray-800 placeholder-gray-500"
                                />
                                <svg className="absolute left-5 top-4.5 w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="lg:w-64">
                            <label htmlFor="status" className="sr-only">Filter by status</label>
                            <select
                                id="status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 shadow-lg transition-all font-bold text-gray-800"
                            >
                                <option value="ALL">All Status</option>
                                <option value={AppointmentStatus.PENDING}>Pending</option>
                                <option value={AppointmentStatus.COMPLETED}>Completed</option>
                            </select>
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

export default AppointmentsPage;