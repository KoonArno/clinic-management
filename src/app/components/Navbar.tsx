// src/app/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Role } from '@prisma/client'; // (TS) 1. Import Role enum จาก Prisma

function Navbar() {
    const { data: session, status } = useSession(); 
    // (TS) 2. กำหนด Type ให้ useState เป็น boolean
    const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
    
    const isLoggedIn = status === "authenticated";
    
    // (TS) 3. Type ของ userRole และ userName จะถูกดึงมาจาก
    // src/types/next-auth.d.ts ที่เราสร้างไว้โดยอัตโนมัติ
    // userRole จะมี Type เป็น Role | undefined
    // userName จะมี Type เป็น string | null | undefined
    const userRole = session?.user?.role;
    const userName = session?.user?.fullName || session?.user?.name;
    
    // (TS) 4. สร้าง Interface สำหรับนิยาม Style ของ Badge
    interface BadgeStyle {
        color: string;
        label: string;
        icon: string;
    }

    // (TS) 5. ใช้ Record<Role, ...> เพื่อให้แน่ใจว่าเรามี Style ครบทุก Role
    const badges: Record<Role, BadgeStyle> = {
        [Role.admin]: { color: "bg-purple-500", label: "Admin", icon: "👑" },
        [Role.reception]: { color: "bg-blue-500", label: "Reception", icon: "👨‍💼" },
        [Role.clinician]: { color: "bg-green-500", label: "Clinician", icon: "👨‍⚕️" }
    };

    // (TS) 6. กำหนด Type ให้ parameter 'role'
    // (เราเช็ค userRole ก่อนเรียกใช้ ทำให้ role ที่ส่งเข้ามาจะไม่มีทางเป็น undefined)
    const getRoleBadge = (role: Role): React.JSX.Element => {
        // (TS) 7. ใช้ Role enum ในการเข้าถึง badges
        const badge = badges[role] || { color: "bg-gray-500", label: role, icon: "👤" };
        
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${badge.color} shadow-sm`}>
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
            </span>
        );
    };
    
    return (
        <nav className='bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg border-b border-gray-700'>
            <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex justify-between items-center h-16'>
                    {/* Logo (ส่วนนี้ไม่ต้องแก้ไข) */}
                    <Link href="/dashboard" className='flex items-center gap-3 group'>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <span className='text-white font-bold text-xl tracking-tight group-hover:text-blue-400 transition-colors'>
                            Clinic CMS
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className='hidden md:flex items-center gap-4'>
                        {isLoggedIn ? (
                            <>
                                {/* User Info */}
                                <div className='flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700'>
                                    <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-sm">
                                            {/* (TS) 8. ใช้ optional chaining (?.) ป้องกันกรณี userName เป็น null/undefined */}
                                            {userName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                        </span>
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className='text-white text-sm font-semibold leading-tight'>
                                            {userName || 'User'}
                                        </span>
                                        {/* (TS) 9. เช็คว่า userRole มีค่าก่อนส่งเข้า getRoleBadge */}
                                        {userRole && (
                                            <span className='text-gray-400 text-xs'>
                                                {getRoleBadge(userRole)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Logout Button (ส่วนนี้ไม่ต้องแก้ไข) */}
                                <button 
                                    onClick={() => signOut()} 
                                    className='inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-medium'
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Login/Register Links (ส่วนนี้ไม่ต้องแก้ไข) */}
                                <Link href="/auth/login" className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium'>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Sign In</span>
                                </Link>
                                <Link href="/auth/register" className='inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium'>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    <span>Sign Up</span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button (ส่วนนี้ไม่ต้องแก้ไข) */}
                    <div className='md:hidden'>
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className='text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2'
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

                {/* Mobile Menu (ส่วนนี้ไม่ต้องแก้ไข Logic) */}
                {showMobileMenu && (
                    <div className='md:hidden py-4 border-t border-gray-700 animate-fade-in'>
                        {isLoggedIn ? (
                            <div className='space-y-4'>
                                {/* User Info */}
                                <div className='bg-gray-800/50 p-4 rounded-xl border border-gray-700'>
                                    <div className='flex items-center gap-3 mb-3'>
                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                            <span className="text-white font-bold">
                                                {userName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                            </span>
                                        </div>
                                        <div className='flex flex-col'>
                                            <span className='text-white text-sm font-semibold'>
                                                {userName || 'User'}
                                            </span>
                                        </div>
                                    </div>
                                    {userRole && (
                                        <div className='mt-2'>
                                            {getRoleBadge(userRole)}
                                        </div>
                                    )}
                                </div>

                                {/* Logout Button */}
                                <button 
                                    onClick={() => {
                                        signOut();
                                        setShowMobileMenu(false);
                                    }} 
                                    className='w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md font-medium'
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
                                    className='w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium'
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Sign In</span>
                                </Link>
                                <Link 
                                    href="/auth/register"
                                    onClick={() => setShowMobileMenu(false)}
                                    className='w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-medium'
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
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