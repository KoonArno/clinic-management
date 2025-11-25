// src/app/components/PageHeader.tsx
import React from 'react';
import Link from 'next/link';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    icon: string;
    actionButton?: {
        label: string;
        href: string;
    };
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actionButton }) => {
    return (
        <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8 animate-fade-in-down'>
            <div>
                <h1 className='text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3'>
                    <span className="text-3xl">{icon}</span>
                    {title}
                </h1>
                <p className="text-slate-500 text-base">{subtitle}</p>
            </div>

            {actionButton && (
                <Link href={actionButton.href} className='inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-200 font-semibold text-sm'>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{actionButton.label}</span>
                </Link>
            )}
        </div>
    );
};

export default PageHeader;
