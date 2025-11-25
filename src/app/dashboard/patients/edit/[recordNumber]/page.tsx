// src/app/dashboard/patients/edit/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { config } from '@/lib/config';

interface PatientData {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    allergies: string | null;
    medicalHistory: string | null;
    currentMedications: string | null;
}

interface PatientEditFormData {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: string;
    allergies: string;
    medicalHistory: string;
    currentMedications: string;
}

const formatDateForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

type Gender = 'male' | 'female' | 'other';

function EditPatientPage() {
    const router = useRouter();
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;

    const { data: session, status } = useSession();

    const [formData, setFormData] = useState<PatientEditFormData>({
        firstName: '',
        lastName: '',
        gender: 'male',
        dateOfBirth: '',
        allergies: '',
        medicalHistory: '',
        currentMedications: '',
    });

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!recordNumber || status !== "authenticated") return;

        const userRole = session?.user?.role;
        if (userRole !== Role.reception && userRole !== Role.admin) {
            setError("You do not have permission to edit patient records.");
            setIsLoading(false);
            return;
        }

        async function fetchPatientData() {
            try {
                const res = await fetch(`${config.apiBaseUrl}/api/patients/${recordNumber}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.message || "Failed to fetch patient data.");
                }
                const data: PatientData = await res.json();

                const genderValue = (data.gender as Gender) || 'other';

                setFormData({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    gender: genderValue,
                    dateOfBirth: formatDateForInput(data.dateOfBirth),
                    allergies: data.allergies || '',
                    medicalHistory: data.medicalHistory || '',
                    currentMedications: data.currentMedications || '',
                });

            } catch (err: any) {
                console.error("Error fetching patient:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPatientData();
    }, [recordNumber, status, session]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'gender') {
            setFormData(prev => ({
                ...prev,
                gender: value as Gender,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const { firstName, lastName, gender, dateOfBirth } = formData;
        if (!firstName || !lastName || !gender || !dateOfBirth) {
            setError("Please fill in First Name, Last Name, Gender, and Date of Birth.");
            return;
        }

        try {
            const payload = {
                ...formData,
                dateOfBirth: new Date(dateOfBirth).toISOString(),
            };

            const res = await fetch(`${config.apiBaseUrl}/api/patients/${recordNumber}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                alert("Patient record updated successfully!");
                router.push(`/dashboard/patients/${recordNumber}`);
            } else {
                const data = await res.json();
                setError(data.message || "Failed to update patient record.");
            }

        } catch (error) {
            console.error("Error updating patient:", error);
            setError("An error occurred while connecting to the server.");
        }
    };

    if (isLoading || status === "loading") {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block relative">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-500 mt-4 font-medium">Loading patient data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-4xl mx-auto'>
            <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-slate-100'>
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Patient Records
            </Link>

            <div className="mb-8 animate-fade-in-down">
                <h1 className='text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3'>
                    <span className="text-3xl">✏️</span>
                    Edit Patient Record
                </h1>
                <p className="text-slate-500 font-medium">Record No: <span className="font-mono font-bold text-slate-700">{recordNumber}</span></p>
            </div>

            <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in'>

                {error && (
                    <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl mb-6 flex items-start gap-3 shadow-sm'>
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Basic Information Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        Basic Information
                    </h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <label className='block text-slate-700 font-bold mb-2 text-sm' htmlFor="firstName">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className='w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400'
                            />
                        </div>
                        <div>
                            <label className='block text-slate-700 font-bold mb-2 text-sm' htmlFor="lastName">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className='w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-900 placeholder-slate-400'
                            />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
                        <div className='col-span-1'>
                            <label className='block text-slate-700 font-bold mb-2 text-sm' htmlFor="gender">
                                Gender <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className='w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-900 appearance-none bg-white'
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-2'>
                            <label className='block text-slate-700 font-bold mb-2 text-sm' htmlFor="dateOfBirth">
                                Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className='w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-900'
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Information Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        Medical Information
                        <span className="text-slate-400 text-sm font-normal ml-2">(Optional)</span>
                    </h2>

                    <div className='space-y-6'>
                        <div>
                            <label className='block text-slate-700 font-bold mb-2 flex items-center gap-2 text-sm' htmlFor="allergies">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Allergies
                            </label>
                            <textarea
                                id="allergies"
                                name="allergies"
                                rows={3}
                                value={formData.allergies}
                                onChange={handleChange}
                                placeholder="e.g., Allergy to Penicillin, Peanuts"
                                className='w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none font-medium text-slate-900 placeholder-slate-400'
                            />
                        </div>

                        <div>
                            <label className='block text-slate-700 font-bold mb-2 flex items-center gap-2 text-sm' htmlFor="medicalHistory">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Medical History
                            </label>
                            <textarea
                                id="medicalHistory"
                                name="medicalHistory"
                                rows={4}
                                value={formData.medicalHistory}
                                onChange={handleChange}
                                placeholder="Past illnesses, surgeries, or treatments..."
                                className='w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none font-medium text-slate-900 placeholder-slate-400'
                            />
                        </div>

                        <div>
                            <label className='block text-slate-700 font-bold mb-2 flex items-center gap-2 text-sm' htmlFor="currentMedications">
                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                Current Medications
                            </label>
                            <textarea
                                id="currentMedications"
                                name="currentMedications"
                                rows={3}
                                value={formData.currentMedications}
                                onChange={handleChange}
                                placeholder="List of medications currently being taken..."
                                className='w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none font-medium text-slate-900 placeholder-slate-400'
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className='inline-flex items-center justify-center gap-2 bg-emerald-600 text-white w-full px-8 py-3.5 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-200 font-bold text-lg'
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                </button>
            </form>
        </div>
    );
}

export default EditPatientPage;