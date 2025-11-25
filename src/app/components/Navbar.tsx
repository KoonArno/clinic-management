// src/app/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Role } from '@prisma/client';

function Navbar() {
    const { data: session, status } = useSession();
    const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

    const isLoggedIn = status === "authenticated";
    const userRole = session?.user?.role;
    const userName = session?.user?.fullName || session?.user?.name;

    interface BadgeStyle {
        color: string;
        label: string;
        icon: string;
    }

    const badges: Record<Role, BadgeStyle> = {
        ['admin' as Role]: { color: "bg-purple-100 text-purple-700 ring-purple-600/20", label: "Admin", icon: "👑" },
        ['reception' as Role]: { color: "bg-blue-100 text-blue-700 ring-blue-600/20", label: "Reception", icon: "👨‍💼" },
        ['clinician' as Role]: { color: "bg-emerald-100 text-emerald-700 ring-emerald-600/20", label: "Clinician", icon: "👨‍⚕️" }
    } as Record<Role, BadgeStyle>;

    const getRoleBadge = (role: Role): React.JSX.Element => {
        const badge = badges[role] || { color: "bg-gray-100 text-gray-700 ring-gray-600/20", label: role, icon: "👤" };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color} ring-1 ring-inset`}>
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
            </span>
        );
    };

    return (
        <nav className='bg-white border-b border-slate-200 sticky top-0 z-50'>
            <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex justify-between items-center h-16'>
                    {/* Logo */}
                    <Link href="/dashboard" className='flex items-center gap-3 group'>
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-sm group-hover:shadow-md transition-all">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <span className='text-slate-800 font-bold text-xl tracking-tight group-hover:text-emerald-600 transition-colors'>
                            Clinic CMS
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className='hidden md:flex items-center gap-4'>
                        {isLoggedIn ? (
                            <>
                                {/* User Info */}
                                <div className='flex items-center gap-3 pl-4 border-l border-slate-200'>
                                    <div className='flex flex-col items-end'>
                                        <span className='text-slate-700 text-sm font-semibold leading-tight'>
                                            {userName || 'User'}
                                        </span>
                                        {userRole && (
                                            <div className='mt-0.5'>
                                                {getRoleBadge(userRole)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center border border-emerald-200">
                                        <span className="text-emerald-700 font-bold text-sm">
                                            {userName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                        </span>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={() => signOut()}
                                    className='inline-flex items-center gap-2 text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm'
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className='text-slate-600 hover:text-emerald-600 font-medium text-sm px-4 py-2'>
                                    Sign In
                                </Link>
                                <Link href="/auth/register" className='inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow font-medium text-sm'>
                                    <span>Get Started</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className='md:hidden'>
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className='text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-2'
                        >
                            {showMobileMenu ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className='md:hidden py-4 border-t border-slate-100 animate-fade-in'>
                        {isLoggedIn ? (
                            <div className='space-y-4'>
                                <div className='bg-slate-50 p-4 rounded-xl border border-slate-100'>
                                    <div className='flex items-center gap-3 mb-3'>
                                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                                            <span className="text-emerald-700 font-bold">
                                                {userName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                            </span>
                                        </div>
                                        <div className='flex flex-col'>
                                            <span className='text-slate-800 text-sm font-semibold'>
                                                {userName || 'User'}
                                            </span>
                                            {userRole && (
                                                <div className='mt-1'>
                                                    {getRoleBadge(userRole)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        signOut();
                                        setShowMobileMenu(false);
                                    }}
                                    className='w-full inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors font-medium'
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                <Link
                                    href="/auth/login"
                                    onClick={() => setShowMobileMenu(false)}
                                    className='w-full inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors font-medium'
                                >
                                    <span>Sign In</span>
                                </Link>
                                <Link
                                    href="/auth/register"
                                    onClick={() => setShowMobileMenu(false)}
                                    className='w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium'
                                >
                                    <span>Sign Up</span>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;