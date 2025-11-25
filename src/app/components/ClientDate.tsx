"use client";

import React, { useState, useEffect } from 'react';

interface ClientDateProps {
    date: string | Date | null | undefined;
    options?: Intl.DateTimeFormatOptions;
    className?: string;
    fallback?: string;
}

export default function ClientDate({ date, options, className, fallback = "N/A" }: ClientDateProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!date) return <span className={className}>{fallback}</span>;

    if (!mounted) {
        // Render a placeholder or the server-safe fallback to avoid mismatch
        // Ideally, we render something that doesn't change layout too much
        return <span className={className}>Loading...</span>;
    }

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const formattedDate = dateObj.toLocaleDateString('en-US', options);
        return <span className={className}>{formattedDate}</span>;
    } catch (e) {
        return <span className={className}>{fallback}</span>;
    }
}
