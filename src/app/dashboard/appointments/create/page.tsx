// src/app/dashboard/appointments/create/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

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
                const res = await fetch(`${config.apiBaseUrl}/api/users/clinicians`);
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
            const res = await fetch(`${config.apiBaseUrl}/api/patients/lookup?query=${query}`);
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

            const res = await fetch(`${config.apiBaseUrl}/api/appointments`, {
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
        <div className='max-w-4xl mx-auto'>
            <Link href="/dashboard/appointments" className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-slate-100'>
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Appointments
            </Link>

            <div className="mb-8 animate-fade-in-down">
                <div className="flex items-center gap-4 mb-3">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                        <span className="text-3xl">📅</span>
                    </div>
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900'>
                            Create Appointment
                        </h1>
                        <p className="text-slate-500 text-base mt-1">Schedule a new patient visit</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in'>

                {formData.error && (
                    <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8 flex items-start gap-3'>
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{formData.error}</span>
                    </div>
                )}

                {/* Patient Lookup */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2 flex items-center gap-2' htmlFor="patientSearch">
                        <span className="bg-emerald-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold">1</span>
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
                            className={`w-full p-3 pl-10 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400 ${formData.patientId === '' && (patientSearch || patientSuggestions.length > 0)
                                ? 'border-red-300 bg-red-50 focus:ring-red-200'
                                : formData.patientId ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-200' : 'border-slate-300 focus:ring-emerald-200'
                                }`}
                            autoComplete="off"
                        />
                        <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {isPatientSelected && (
                            <div className="absolute right-3 top-3">
                                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {formData.patientId === '' && patientSearch && (
                        <p className="text-red-600 text-xs mt-1 font-medium">Please select a patient from the list.</p>
                    )}

                    {patientSuggestions.length > 0 && formData.patientId === '' && (
                        <ul className="border border-slate-200 rounded-xl mt-2 max-h-60 overflow-y-auto bg-white shadow-lg z-10 absolute w-full max-w-4xl">
                            {patientSuggestions.map(patient => (
                                <li
                                    key={patient.id}
                                    onClick={() => handlePatientSelect(patient)}
                                    className="p-3 cursor-pointer hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0 text-slate-700 font-medium"
                                >
                                    {patient.display}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Clinician Selection */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2 flex items-center gap-2' htmlFor="doctorId">
                        <span className="bg-emerald-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold">2</span>
                        Assign Clinician <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="doctorId"
                        name="doctorId"
                        onChange={handleChange}
                        value={formData.doctorId}
                        className='w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900 bg-white'
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
                    <label className='block text-slate-900 font-bold text-base mb-2 flex items-center gap-2'>
                        <span className="bg-emerald-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold">3</span>
                        Select Time Slot <span className="text-red-500">*</span>
                    </label>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <label className='text-xs font-semibold text-slate-500 mb-1 block' htmlFor="date">Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                onChange={handleChange}
                                className='w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900'
                            />
                        </div>
                        <div>
                            <label className='text-xs font-semibold text-slate-500 mb-1 block' htmlFor="startTime">Start Time</label>
                            <input
                                type="time"
                                id="startTime"
                                name="startTime"
                                onChange={handleChange}
                                className='w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900'
                            />
                        </div>
                        <div>
                            <label className='text-xs font-semibold text-slate-500 mb-1 block' htmlFor="endTime">End Time</label>
                            <input
                                type="time"
                                id="endTime"
                                name="endTime"
                                onChange={handleChange}
                                className='w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-900'
                            />
                        </div>
                    </div>
                </div>

                {/* Reception Notes */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2 flex items-center gap-2' htmlFor="notesReception">
                        <span className="bg-emerald-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold">4</span>
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Reception Notes
                        <span className="text-slate-400 text-sm font-normal">(Optional)</span>
                    </label>
                    <textarea
                        id="notesReception"
                        name="notesReception"
                        rows={4}
                        placeholder="Add any additional information or reason for visit..."
                        onChange={handleChange}
                        className='w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-slate-900 placeholder-slate-400'
                    />
                </div>

                <button
                    type="submit"
                    className='bg-emerald-600 text-white w-full py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2'
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Create Appointment</span>
                </button>
            </form>
        </div>
    );
}

export default CreateAppointmentPage;