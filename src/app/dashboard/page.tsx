// src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

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

  let welcomeMessage = "Dashboard Overview";
  let userRole: Role | undefined;
  
  if (status === "loading") {
      welcomeMessage = "Loading...";
  } else if (status === "authenticated") {
      const displayName = session.user.fullName || session.user.name;
      welcomeMessage = `Welcome back, ${displayName}`;
      userRole = session.user.role;
  }

  useEffect(() => {
      if (status === "authenticated") {
          const fetchStats = async () => {
              setIsLoadingStats(true);
              try {
                  const response = await fetch('/api/dashboard/stats');
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
    const badges: Record<Role, string> = {
      [Role.admin]: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30",
      [Role.reception]: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30",
      [Role.clinician]: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30"
    };
    const roleLabels: Record<Role, string> = {
      [Role.admin]: "Administrator",
      [Role.reception]: "Receptionist",
      [Role.clinician]: "Clinician"
    };

    const style = badges[role] || 'bg-gray-100 text-gray-800';
    const label = roleLabels[role] || role;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${style} transform hover:scale-105 transition-all duration-300`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <Navbar />
        
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10'>
            {/* Header Section */}
            <div className='mb-10 animate-fade-in-down'>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h1 className='text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-2'>
                            {welcomeMessage}
                        </h1>
                        <p className="text-gray-600 text-lg font-medium">Manage your clinic with confidence and ease</p>
                    </div>
                    {status === "authenticated" && userRole && (
                        <div className="flex items-center gap-3">
                            {getRoleBadge(userRole)}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Stats Cards with Glass Morphism */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
                {/* Today's Appointments Card */}
                <div className='group relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-blue-200 hover:-translate-y-2 overflow-hidden'>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-5xl font-black text-gray-900 group-hover:scale-110 transition-transform duration-500">
                                {isLoadingStats ? (
                                    <span className="animate-pulse">—</span>
                                ) : (
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">{stats.todayCount}</span>
                                )}
                            </span>
                        </div>
                        <h3 className='text-base font-bold text-gray-800 mb-1'>Today's Appointments</h3>
                        <p className='text-sm text-gray-600 font-medium'>Check all scheduled visits</p>
                    </div>
                </div>

                {/* Total Patients Card */}
                <div className='group relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-green-200 hover:-translate-y-2 overflow-hidden'>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-500">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-5xl font-black text-gray-900 group-hover:scale-110 transition-transform duration-500">
                                {isLoadingStats ? (
                                    <span className="animate-pulse">—</span>
                                ) : (
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-800">{stats.totalPatients}</span>
                                )}
                            </span>
                        </div>
                        <h3 className='text-base font-bold text-gray-800 mb-1'>Total Patients</h3>
                        <p className='text-sm text-gray-600 font-medium'>Registered in system</p>
                    </div>
                </div>

                {/* Pending Card */}
                <div className='group relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-amber-200 hover:-translate-y-2 overflow-hidden'>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-500">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-5xl font-black text-gray-900 group-hover:scale-110 transition-transform duration-500">
                                {isLoadingStats ? (
                                    <span className="animate-pulse">—</span>
                                ) : (
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800">{stats.pendingCount}</span>
                                )}
                            </span>
                        </div>
                        <h3 className='text-base font-bold text-gray-800 mb-1'>Pending Tasks</h3>
                        <p className='text-sm text-gray-600 font-medium'>Awaiting completion</p>
                    </div>
                </div>
            </div>

            {/* Main Action Cards */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10'>
                {/* Appointments Card */}
                <Link href="/dashboard/appointments" className='block group'>
                    <div className='relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.03] h-80'>
                        {/* Animated Background Patterns */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl -ml-24 -mb-24 group-hover:scale-150 transition-transform duration-1000"></div>
                        </div>
                        
                        <div className='relative p-10 h-full flex flex-col justify-between z-10'>
                            <div>
                                <div className="bg-white/20 backdrop-blur-md w-20 h-20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                    <span className="text-5xl">📅</span>
                                </div>
                                <h2 className='text-4xl font-black text-white mb-4 drop-shadow-lg'>Appointments</h2>
                                <p className='text-blue-100 text-lg font-medium leading-relaxed'>View and manage all scheduled appointments with ease</p>
                            </div>
                            <div className="flex items-center text-white font-bold text-lg group-hover:translate-x-3 transition-transform duration-300">
                                <span>Open Dashboard</span>
                                <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Patient Records Card */}
                <Link href="/dashboard/patients" className='block group'>
                    <div className='relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.03] h-80'>
                        {/* Animated Background Patterns */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl -ml-24 -mb-24 group-hover:scale-150 transition-transform duration-1000"></div>
                        </div>
                        
                        <div className='relative p-10 h-full flex flex-col justify-between z-10'>
                            <div>
                                <div className="bg-white/20 backdrop-blur-md w-20 h-20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                    <span className="text-5xl">🧑‍⚕️</span>
                                </div>
                                <h2 className='text-4xl font-black text-white mb-4 drop-shadow-lg'>Patient Records</h2>
                                <p className='text-green-100 text-lg font-medium leading-relaxed'>Access comprehensive patient medical history and information</p>
                            </div>
                            <div className="flex items-center text-white font-bold text-lg group-hover:translate-x-3 transition-transform duration-300">
                                <span>Open Dashboard</span>
                                <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-1 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
                    <h2 className="text-3xl font-black text-gray-900">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(userRole === Role.reception || userRole === Role.admin) && (
                        <>
                            <Link href="/dashboard/appointments/create" className="group relative bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-300 hover:-translate-y-1 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 text-lg block">New Appointment</span>
                                        <span className="text-sm text-gray-600 font-medium">Schedule a visit</span>
                                    </div>
                                </div>
                            </Link>
                            <Link href="/dashboard/patients/create" className="group relative bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-300 hover:-translate-y-1 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 text-lg block">New Patient</span>
                                        <span className="text-sm text-gray-600 font-medium">Register patient</span>
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}
                    <Link href="/dashboard/appointments" className="group relative bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-300 hover:-translate-y-1 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 text-lg block">Search Records</span>
                                <span className="text-sm text-gray-600 font-medium">Find information</span>
                            </div>
                        </div>
                    </Link>
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
            .animate-fade-in-up {
                animation: fade-in-up 0.8s ease-out 0.3s both;
            }
        `}</style>
    </div>
  )
}

export default DashboardPage;