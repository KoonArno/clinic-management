// src/app/dashboard/patients/create/page.tsx
"use client";

import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PatientFormData {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: string;
    allergies: string;
    medicalHistory: string;
    currentMedications: string;
    error: string;
}

type Gender = 'male' | 'female' | 'other';

function CreatePatientPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<PatientFormData>({
        firstName: '',
        lastName: '',
        gender: 'male',
        dateOfBirth: '',
        allergies: '',
        medicalHistory: '',
        currentMedications: '',
        error: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'gender') {
            setFormData(prev => ({
                ...prev,
                gender: value as Gender,
                error: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                error: ''
            }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const { firstName, lastName, gender, dateOfBirth } = formData;
        if (!firstName || !lastName || !gender || !dateOfBirth) {
            setFormData({ ...formData, error: "Please fill in First Name, Last Name, Gender, and Date of Birth." });
            return;
        }

        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                dateOfBirth: new Date(dateOfBirth).toISOString(),
                allergies: formData.allergies,
                medicalHistory: formData.medicalHistory,
                currentMedications: formData.currentMedications,
            };

            const res = await fetch("http://localhost:3000/api/patients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                alert("Patient record created successfully!");
                router.push('/dashboard/patients'); 
            } else {
                const data = await res.json();
                setFormData({ ...formData, error: data.message || "Failed to create patient record." });
            }

        } catch (error) {
            console.error("Error creating patient:", error);
            setFormData({ ...formData, error: "An error occurred while connecting to the server." });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <Navbar />
            
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl relative z-10'>
                <Link href="/dashboard/patients" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Patient Records
                </Link>
                
                <div className="mb-10 animate-fade-in-down">
                    <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 mb-3 flex items-center gap-4'>
                        <span className="text-5xl">🧑</span>
                        Add New Patient
                    </h1>
                    <p className="text-gray-700 text-lg font-semibold">Create a new patient record in the system</p>
                </div>
                
                <form onSubmit={handleSubmit} className='bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-fade-in'>
                    
                    {formData.error && (
                        <div className='bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-lg'>
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <span className="font-semibold">{formData.error}</span>
                        </div>
                    )}

                    {/* Basic Information Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            Basic Information
                        </h2>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <label className='block text-gray-700 font-bold mb-2 text-sm' htmlFor="firstName">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    value={formData.firstName}
                                    onChange={handleChange} 
                                    placeholder="John" 
                                    className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all font-semibold placeholder-gray-400'
                                />
                            </div>
                            <div>
                                <label className='block text-gray-700 font-bold mb-2 text-sm' htmlFor="lastName">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    value={formData.lastName}
                                    onChange={handleChange} 
                                    placeholder="Doe" 
                                    className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all font-semibold placeholder-gray-400'
                                />
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
                            <div className='col-span-1'>
                                <label className='block text-gray-700 font-bold mb-2 text-sm' htmlFor="gender">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    id="gender" 
                                    name="gender" 
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all font-semibold'
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className='col-span-2'>
                                <label className='block text-gray-700 font-bold mb-2 text-sm' htmlFor="dateOfBirth">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    id="dateOfBirth" 
                                    name="dateOfBirth" 
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all font-semibold'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3 pb-4 border-b-2 border-gradient-to-r from-green-200 to-emerald-200">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            Medical Information
                            <span className="text-gray-500 text-sm font-normal ml-2">(Optional)</span>
                        </h2>

                        <div className='space-y-6'>
                            <div>
                                <label className='block text-gray-700 font-bold mb-2 flex items-center gap-2 text-sm' htmlFor="allergies">
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
                                    className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all resize-none font-medium placeholder-gray-400'
                                />
                            </div>

                            <div>
                                <label className='block text-gray-700 font-bold mb-2 flex items-center gap-2 text-sm' htmlFor="medicalHistory">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                                    className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all resize-none font-medium placeholder-gray-400'
                                />
                            </div>

                            <div>
                                <label className='block text-gray-700 font-bold mb-2 flex items-center gap-2 text-sm' htmlFor="currentMedications">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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
                                    className='w-full px-4 py-3 border-2 border-indigo-200 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all resize-none font-medium placeholder-gray-400'
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className='group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 via-emerald-700 to-teal-700 text-white w-full px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 font-black text-lg hover:scale-[1.02] relative overflow-hidden'
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="relative z-10">Save Patient Record</span>
                    </button>
                </form>
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
                @keyframes fade-in {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.8s ease-out;
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out 0.2s both;
                }
            `}</style>
        </div>
    );
}

export default CreatePatientPage;