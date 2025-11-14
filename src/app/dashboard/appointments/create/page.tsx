// src/app/dashboard/appointments/create/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Clinician {
    id: number;
    username: string;
    fullName: string;
}

interface PatientSuggestion {
    id: number;
    display: string;
    recordNumber: string;
}

interface AppointmentFormData {
    patientId: number | string;
    doctorId: number | string;
    date: string;
    startTime: string;
    endTime: string;
    notesReception: string;
    error: string;
}

function CreateAppointmentPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<AppointmentFormData>({
        patientId: '',
        doctorId: '',
        date: '',
        startTime: '',
        endTime: '',
        notesReception: '',
        error: '',
    });

    const [clinicians, setClinicians] = useState<Clinician[]>([]);
    const [patientSearch, setPatientSearch] = useState<string>('');
    const [patientSuggestions, setPatientSuggestions] = useState<PatientSuggestion[]>([]);
    const [isPatientSelected, setIsPatientSelected] = useState<boolean>(false);
    
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        async function fetchClinicians() {
            try {
                const res = await fetch("http://localhost:3000/api/users/clinicians");
                if (res.ok) {
                    const data: Clinician[] = await res.json();
                    setClinicians(data);
                } else {
                    console.error("Failed to fetch clinicians");
                }
            } catch (err) {
                console.error("Error fetching clinicians:", err);
            }
        }
        fetchClinicians();
    }, []);

    const searchPatients = useCallback(async (query: string) => {
        if (query.length < 2) {
            setPatientSuggestions([]);
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/patients/lookup?query=${query}`);
            if (res.ok) {
                const data: PatientSuggestion[] = await res.json();
                setPatientSuggestions(data);
            } else {
                setPatientSuggestions([]);
            }
        } catch (err) {
            console.error("Lookup error:", err);
            setPatientSuggestions([]);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPatientSearch(value);
        setIsPatientSelected(false);
        setFormData(prev => ({ ...prev, patientId: '' }));

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            searchPatients(value);
        }, 300);
    };

    const handlePatientSelect = (patient: PatientSuggestion) => {
        setPatientSearch(patient.display);
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        setPatientSuggestions([]);
        setIsPatientSelected(true);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value, error: '' });
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const { patientId, doctorId, date, startTime, endTime } = formData;
        if (!patientId || !doctorId || !date || !startTime || !endTime) {
            setFormData({ ...formData, error: "Please ensure a Patient and Clinician are selected, and all time fields are filled." });
            return;
        }

        const startDateTime = new Date(`${date} ${startTime}`).toISOString();
        const endDateTime = new Date(`${date} ${endTime}`).toISOString();

        try {
            const payload = {
                patientId: patientId,
                doctorId: parseInt(String(doctorId)),
                startTime: startDateTime,
                endTime: endDateTime,
                notesReception: formData.notesReception,
            };

            const res = await fetch("http://localhost:3000/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                alert("Appointment created successfully!");
                router.push('/dashboard/appointments');
            } else {
                const data = await res.json();
                setFormData({ ...formData, error: data.message || "Failed to create appointment." });
            }

        } catch (error) {
            console.error("Error creating appointment:", error);
            setFormData({ ...formData, error: "An error occurred while connecting to the server." });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <Navbar />
            
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl relative z-10'>
                <Link href="/dashboard/appointments" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Appointments
                </Link>
                
                <div className="mb-10 animate-fade-in-down">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-4 rounded-3xl shadow-2xl">
                            <span className="text-5xl">📅</span>
                        </div>
                        <div>
                            <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'>
                                Create Appointment
                            </h1>
                            <p className="text-gray-700 text-lg font-semibold mt-2">Schedule a new patient visit</p>
                        </div>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className='bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10 animate-fade-in'>
                    
                    {formData.error && (
                        <div className='bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-700 p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-lg'>
                            <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <span className="font-semibold">{formData.error}</span>
                        </div>
                    )}

                    {/* Patient Lookup */}
                    <div className='mb-8'>
                        <label className='block text-gray-900 font-black text-lg mb-3 flex items-center gap-2' htmlFor="patientSearch">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black">1</span>
                            Find Patient <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="patientSearch"
                                name="patientSearch"
                                placeholder="Type patient record number or name..."
                                value={patientSearch}
                                onChange={handleSearchChange}
                                className={`w-full p-5 pl-14 border-2 rounded-2xl shadow-lg focus:ring-4 focus:border-transparent transition-all font-semibold ${
                                    formData.patientId === '' && (patientSearch || patientSuggestions.length > 0) 
                                    ? 'border-red-400 bg-red-50 focus:ring-red-300' 
                                    : formData.patientId ? 'border-green-400 bg-green-50 focus:ring-green-300' : 'border-gray-300 focus:ring-indigo-300'
                                }`}
                                autoComplete="off"
                            />
                            <svg className="absolute left-5 top-5 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {isPatientSelected && (
                                <div className="absolute right-5 top-5">
                                    <svg className="w-7 h-7 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {formData.patientId === '' && patientSearch && (
                           <p className="text-red-600 text-sm mt-2 font-semibold">Please select a patient from the list.</p>
                        )}
                        
                        {patientSuggestions.length > 0 && formData.patientId === '' && (
                            <ul className="border-2 border-indigo-200 rounded-2xl mt-2 max-h-60 overflow-y-auto bg-white shadow-2xl">
                                {patientSuggestions.map(patient => (
                                    <li 
                                        key={patient.id} 
                                        onClick={() => handlePatientSelect(patient)}
                                        className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all border-b border-gray-100 last:border-b-0 font-semibold hover:pl-6"
                                    >
                                        {patient.display}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    {/* Clinician Selection */}
                    <div className='mb-8'>
                        <label className='block text-gray-900 font-black text-lg mb-3 flex items-center gap-2' htmlFor="doctorId">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black">2</span>
                            Assign Clinician <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="doctorId"
                            name="doctorId"
                            onChange={handleChange}
                            value={formData.doctorId}
                            className='w-full p-5 border-2 border-gray-300 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-bold text-gray-800'
                        >
                            <option value="" disabled>Select a clinician...</option>
                            {clinicians.map(clinician => (
                                <option key={clinician.id} value={clinician.id}>
                                    {clinician.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Date and Time Section */}
                    <div className="mb-8">
                        <label className='block text-gray-900 font-black text-lg mb-3 flex items-center gap-2'>
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black">3</span>
                            Select Time Slot <span className="text-red-500">*</span>
                        </label>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                            <div>
                                <label className='text-sm font-bold text-gray-600 mb-2 block' htmlFor="date">Date</label>
                                <input 
                                    type="date" 
                                    id="date" 
                                    name="date" 
                                    onChange={handleChange} 
                                    className='w-full p-5 border-2 border-gray-300 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-semibold'
                                />
                            </div>
                            <div>
                                <label className='text-sm font-bold text-gray-600 mb-2 block' htmlFor="startTime">Start Time</label>
                                <input 
                                    type="time" 
                                    id="startTime" 
                                    name="startTime" 
                                    onChange={handleChange} 
                                    className='w-full p-5 border-2 border-gray-300 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-semibold'
                                />
                            </div>
                            <div>
                                <label className='text-sm font-bold text-gray-600 mb-2 block' htmlFor="endTime">End Time</label>
                                <input 
                                    type="time" 
                                    id="endTime" 
                                    name="endTime" 
                                    onChange={handleChange} 
                                    className='w-full p-5 border-2 border-gray-300 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-semibold'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reception Notes */}
                    <div className='mb-10'>
                        <label className='block text-gray-900 font-black text-lg mb-3 flex items-center gap-2' htmlFor="notesReception">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black">4</span>
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Reception Notes 
                            <span className="text-gray-400 text-base font-normal">(Optional)</span>
                        </label>
                        <textarea 
                            id="notesReception" 
                            name="notesReception" 
                            rows={5} 
                            placeholder="Add any additional information or reason for visit..." 
                            onChange={handleChange} 
                            className='w-full p-5 border-2 border-gray-300 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all resize-none font-medium'
                        />
                    </div>

                    <button 
                        type="submit" 
                        className='bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 text-white w-full p-5 rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden'
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <svg className="w-7 h-7 group-hover:scale-110 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="relative z-10">Create Appointment</span>
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

export default CreateAppointmentPage;