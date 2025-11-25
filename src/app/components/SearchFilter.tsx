import React from 'react';
import { AppointmentStatus } from '@prisma/client';

interface SearchFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    statusOptions: { value: string; label: string }[];
}

const SearchFilter: React.FC<SearchFilterProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    statusOptions,
}) => {
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 mb-10 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            id="search"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 shadow-lg transition-all font-semibold text-gray-800 placeholder-gray-500"
                        />
                        <svg className="absolute left-5 top-4.5 w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="lg:w-64">
                    <label htmlFor="status" className="sr-only">Filter by status</label>
                    <select
                        id="status"
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        className="w-full px-6 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 shadow-lg transition-all font-bold text-gray-800"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default SearchFilter;
