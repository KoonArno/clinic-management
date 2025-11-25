"use client";

import React from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isDashboardRoot = pathname === '/dashboard';
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar />

            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10'>
                {mounted && !isDashboardRoot && (
                    <Link href="/dashboard" className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium mb-6 transition-colors group'>
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                )}

                {children}
            </div>
        </div>
    );
}
