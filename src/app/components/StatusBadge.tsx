import React from 'react';
import { AppointmentStatus } from '@prisma/client';

interface StatusBadgeProps {
    status: AppointmentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const styles: Record<AppointmentStatus, string> = {
        ['PENDING' as AppointmentStatus]: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30',
        ['COMPLETED' as AppointmentStatus]: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30',
        // [AppointmentStatus.CANCELLED]: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
    } as Record<AppointmentStatus, string>;

    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
