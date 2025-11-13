// src/app/dashboard/appointments/page.tsx
"use client";

// (TS) 1. Import React และ Types/Enums
import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

// (TS) 2. สร้าง Interface สำหรับข้อมูล Appointment ที่รับมาจาก API
// (อ้างอิงจาก API /api/appointments/route.ts)
interface AppointmentData {
    recordNumber: string;
    startTime: string; // ISO String
    endTime: string; // ISO String
    status: AppointmentStatus; // (TS) 3. ใช้ enum
    patientName: string;
    patientRecordNumber: string;
    doctorUsername: string;
    createdByUsername: string;
    notesReception: string | null;
}

// (TS) 4. สร้าง Type สำหรับ Status Filter (รวม 'ALL')
type StatusFilter = AppointmentStatus | 'ALL';

function AppointmentsPage() {
    // (TS) 5. กำหนด Type ให้ State
    const [appointments, setAppointments] = useState<AppointmentData[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<AppointmentData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL'); // (TS) 6. ใช้ Type ที่สร้าง

    const { data: session, status } = useSession();
    const userRole = session?.user?.role;

    useEffect(() => {
        if (status === "authenticated") {
            async function fetchAppointments() {
                try {
                    const response = await fetch("http://localhost:3000/api/appointments");
                    if (!response.ok) {
                        throw new Error(`Failed to fetch appointments: ${response.statusText}`);
                    }
                    // (TS) 7. กำหนด Type data
                    const data: AppointmentData[] = await response.json();
                    setAppointments(data);
                    setFilteredAppointments(data);
                } catch (err: any) { // (TS) 8. Type error
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

    // Filter appointments
    useEffect(() => {
        let filtered = appointments;
        
        if (statusFilter !== 'ALL') {
            // (TS) 9. apt.status เป็น enum, statusFilter เป็น StatusFilter
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }
        
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.patientName.toLowerCase().includes(search) ||
                apt.patientRecordNumber.toLowerCase().includes(search) ||
                apt.doctorUsername.toLowerCase().includes(search) ||
                apt.recordNumber.toLowerCase().includes(search)
            );
        }
        
        setFilteredAppointments(filtered);
    }, [searchTerm, statusFilter, appointments]);

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

    // (TS) 11. กำหนด Type parameter
    const getStatusBadge = (status: AppointmentStatus): React.JSX.Element => {
        // (TS) 12. ใช้ Record + enum
        const styles: Record<AppointmentStatus, string> = {
            [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            [AppointmentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
            [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200'
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    // (TS) 13. กำหนด Type return
    const renderTableContent = (): React.JSX.Element => {
        if (isLoading || status === "loading") {
            return (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-4">Loading appointments...</p>
                </div>
            );
        }
        
        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            );
        }

        if (filteredAppointments.length === 0) {
            return (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 text-lg mb-2">
                        {searchTerm || statusFilter !== 'ALL' ? 'No appointments found matching your filters' : 'No appointments scheduled'}
                    </p>
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time Slot</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Clinician</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created By</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredAppointments.map((apt) => (
                                <tr key={apt.recordNumber} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition duration-200 group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link href={`/dashboard/appointments/${apt.recordNumber}`} className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                                            {apt.recordNumber}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Link href={`/dashboard/patients/${apt.patientRecordNumber}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 hover:underline">
                                                {apt.patientName}
                                            </Link>
                                            <span className="text-xs text-gray-500 font-mono">{apt.patientRecordNumber}</span>
                                        </div>
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
                                        {getStatusBadge(apt.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{apt.createdByUsername}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // (TS) 14. ใช้ Role enum
    const canCreateAppointment = userRole === Role.reception || userRole === Role.admin;

    // Calculate stats (ส่วนนี้ TypeScript ตรวจสอบ Type อัตโนมัติ)
    const stats = {
        total: appointments.length,
        pending: appointments.filter(a => a.status === AppointmentStatus.PENDING).length,
        completed: appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length,
        showing: filteredAppointments.length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
                <Link href="/dashboard" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>
                
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8'>
                    <div>
                        <h1 className='text-4xl font-bold text-gray-900 flex items-center gap-3'>
                            <span className="text-4xl">📅</span>
                            Appointments
                        </h1>
                        <p className="text-gray-600 mt-2">Manage all scheduled appointments</p>
                    </div>
                    
                    {canCreateAppointment && (
                        <Link href="/dashboard/appointments/create" className='inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold group'>
                            <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Create Appointment
                        </Link>
                    )}
                </div>

                {/* Stats Cards (ส่วน JSX เหมือนเดิม) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Showing Results</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.showing}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="search" className="sr-only">Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by patient, clinician, or record no..."
                                    value={searchTerm}
                                    // (TS) 15. e.target.value เป็น string
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                                />
                                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="sm:w-48">
                            <label htmlFor="status" className="sr-only">Filter by status</label>
                            <select
                                id="status"
                                value={statusFilter}
                                // (TS) 16. Cast e.target.value ให้เป็น StatusFilter
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                            >
                                <option value="ALL">All Status</option>
                                <option value={AppointmentStatus.PENDING}>Pending</option>
                                <option value={AppointmentStatus.COMPLETED}>Completed</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8">
                    {renderTableContent()}
                </div>
            </div>
        </div>
    );
}

export default AppointmentsPage;