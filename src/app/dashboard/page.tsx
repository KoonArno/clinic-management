"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { config } from '@/lib/config';

interface DashboardStats {
    todayCount: number | string;
    totalPatients: number | string;
    pendingCount: number | string;
}

function DashboardPage() {
    const { data: session, status } = useSession();

    const [stats, setStats] = useState<DashboardStats>({
        todayCount: '—',
        totalPatients: '—',
        pendingCount: '—'
    });
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    let welcomeMessage = "Dashboard Overview";
    let userRole: Role | undefined;

    if (mounted) {
        if (status === "loading") {
            welcomeMessage = "Loading...";
        } else if (status === "authenticated") {
            const displayName = session.user.fullName || session.user.name;
            welcomeMessage = `Welcome back, ${displayName}`;
            userRole = session.user.role;
        }
    }

    useEffect(() => {
        if (status === "authenticated") {
            const fetchStats = async () => {
                setIsLoadingStats(true);
                try {
                    const response = await fetch(`${config.apiBaseUrl}/api/dashboard/stats`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch stats');
                    }
                    const data: DashboardStats = await response.json();
                    setStats(data);
                } catch (error) {
                    console.error("Error fetching stats:", error);
                } finally {
                    setIsLoadingStats(false);
                }
            };
            fetchStats();
        }
    }, [status]);

    const getRoleBadge = (role: Role): React.JSX.Element => {
        const badges = {
            ['admin' as Role]: "bg-purple-100 text-purple-700 ring-1 ring-purple-600/20",
            ['reception' as Role]: "bg-blue-100 text-blue-700 ring-1 ring-blue-600/20",
            ['clinician' as Role]: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20"
        } as Record<Role, string>;
        const roleLabels = {
            ['admin' as Role]: "Administrator",
            ['reception' as Role]: "Receptionist",
            ['clinician' as Role]: "Clinician"
        } as Record<Role, string>;

        const style = badges[role] || 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
        const label = roleLabels[role] || role;

        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${style}`}>
                {label}
            </span>
        );
    };

    return (
        <>
            {/* Header Section */}
            <div className='mb-8 animate-fade-in-down'>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-2">
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900 mb-1'>
                            {welcomeMessage}
                        </h1>
                        <p className="text-slate-500 text-base">Manage your clinic with confidence and ease</p>
                    </div>
                    {mounted && status === "authenticated" && userRole && (
                        <div className="flex items-center gap-3">
                            {getRoleBadge(userRole)}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                {/* Today's Appointments Card */}
                <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow'>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-3xl font-bold text-slate-900">
                            {isLoadingStats ? (
                                <span className="animate-pulse text-slate-300">—</span>
                            ) : (
                                stats.todayCount
                            )}
                        </span>
                    </div>
                    <h3 className='text-sm font-medium text-slate-500'>Today&apos;s Appointments</h3>
                </div>

                {/* Total Patients Card */}
                <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow'>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-emerald-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-3xl font-bold text-slate-900">
                            {isLoadingStats ? (
                                <span className="animate-pulse text-slate-300">—</span>
                            ) : (
                                stats.totalPatients
                            )}
                        </span>
                    </div>
                    <h3 className='text-sm font-medium text-slate-500'>Total Patients</h3>
                </div>

                {/* Pending Card */}
                <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow'>
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-amber-50 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-3xl font-bold text-slate-900">
                            {isLoadingStats ? (
                                <span className="animate-pulse text-slate-300">—</span>
                            ) : (
                                stats.pendingCount
                            )}
                        </span>
                    </div>
                    <h3 className='text-sm font-medium text-slate-500'>Pending Tasks</h3>
                </div>
            </div>

            {/* Main Action Cards */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                {/* Appointments Card */}
                <Link href="/dashboard/appointments" className='block group'>
                    <div className='relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 h-64'>
                        <div className='p-8 h-full flex flex-col justify-between relative z-10'>
                            <div>
                                <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-3xl">📅</span>
                                </div>
                                <h2 className='text-2xl font-bold text-slate-900 mb-2'>Appointments</h2>
                                <p className='text-slate-500 font-medium'>View and manage all scheduled appointments</p>
                            </div>
                            <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                <span>Open Dashboard</span>
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    </div>
                </Link>

                {/* Patient Records Card */}
                <Link href="/dashboard/patients" className='block group'>
                    <div className='relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 h-64'>
                        <div className='p-8 h-full flex flex-col justify-between relative z-10'>
                            <div>
                                <div className="bg-emerald-50 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-3xl">🧑‍⚕️</span>
                                </div>
                                <h2 className='text-2xl font-bold text-slate-900 mb-2'>Patient Records</h2>
                                <p className='text-slate-500 font-medium'>Access comprehensive patient medical history</p>
                            </div>
                            <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                <span>Open Dashboard</span>
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    </div>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="animate-fade-in-up">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mounted && (userRole === Role.reception || userRole === Role.admin) && (
                        <>
                            <Link href="/dashboard/appointments/create" className="group bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 p-2.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900 block">New Appointment</span>
                                        <span className="text-sm text-slate-500">Schedule a visit</span>
                                    </div>
                                </div>
                            </Link>
                            <Link href="/dashboard/patients/create" className="group bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-50 p-2.5 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900 block">New Patient</span>
                                        <span className="text-sm text-slate-500">Register patient</span>
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}
                    <Link href="/dashboard/appointments" className="group bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-50 p-2.5 rounded-lg group-hover:bg-purple-100 transition-colors">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-slate-900 block">Search Records</span>
                                <span className="text-sm text-slate-500">Find information</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    )
}

export default DashboardPage;