// src/app/components/StatsCard.tsx
import React from 'react';

interface StatsCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    gradientFrom?: string; // Optional now, as we might use fixed styles
    gradientTo?: string;
    iconBgFrom?: string;
    iconBgTo?: string;
    textColor?: string;
    className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    // We can keep these for backward compatibility or use them for specific color accents
    iconBgFrom = "from-emerald-500",
    iconBgTo = "to-teal-600",
    textColor = "text-slate-900",
    className = ""
}) => {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${iconBgFrom} ${iconBgTo} p-3 rounded-lg shadow-sm`}>
                    {/* Ensure icon is white or appropriate color */}
                    <div className="text-white">
                        {icon}
                    </div>
                </div>
                <span className={`text-3xl font-bold ${textColor}`}>
                    {value}
                </span>
            </div>
            <h3 className='text-sm font-medium text-slate-500'>{title}</h3>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
    );
};

export default StatsCard;
