// src/app/dashboard/appointments/create/page.tsx
"use client";

// (TS) 1. Import React และ Types/Hooks
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// (TS) 2. Interface สำหรับ Clinician ที่ดึงมาจาก API
interface Clinician {
    id: number;
    username: string;
    fullName: string;
}

// (TS) 3. Interface สำหรับ Patient Suggestion (จาก API /lookup)
interface PatientSuggestion {
    id: number;
    display: string;
    recordNumber: string;
}

// (TS) 4. Interface สำหรับ Form Data
interface AppointmentFormData {
    patientId: number | string; // (TS) 5. เก็บ id (number) แต่ตอนเริ่มเป็น string
    doctorId: number | string;
    date: string;
    startTime: string;
    endTime: string;
    notesReception: string;
    error: string;
}

function CreateAppointmentPage() {
    const router = useRouter();
    // (TS) 6. กำหนด Type ให้ State
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
    
    // (TS) 7. กำหนด Type ให้ useRef สำหรับ Debounce
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        async function fetchClinicians() {
            try {
                const res = await fetch("http://localhost:3000/api/users/clinicians");
                if (res.ok) {
                    // (TS) 8. กำหนด Type data
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

    // (TS) 9. กำหนด Type parameter 'query'
    const searchPatients = useCallback(async (query: string) => {
        if (query.length < 2) {
            setPatientSuggestions([]);
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/patients/lookup?query=${query}`);
            if (res.ok) {
                // (TS) 10. กำหนด Type data
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

    // (TS) 11. กำหนด Type Event
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

    // (TS) 12. กำหนด Type parameter 'patient'
    const handlePatientSelect = (patient: PatientSuggestion) => {
        setPatientSearch(patient.display);
        setFormData(prev => ({ ...prev, patientId: patient.id })); // (TS) 13. patient.id เป็น number
        setPatientSuggestions([]);
        setIsPatientSelected(true);
    };
    
    // (TS) 14. กำหนด Type Event
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value, error: '' });
    };
    
    // (TS) 15. กำหนด Type Form Event
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
            // (TS) 16. สร้าง Payload ที่มี Type ถูกต้อง
            const payload = {
                patientId: patientId, // (TS) 17. patientId เป็น number แล้ว
                doctorId: parseInt(String(doctorId)), // (TS) 18. doctorId ต้องแปลงเป็น number
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl'>
                <Link href="/dashboard/appointments" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Appointments
                </Link>
                
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">📅</span>
                        <h1 className='text-4xl font-bold text-gray-900'>Create Appointment</h1>
                    </div>
                    <p className="text-gray-600 text-lg ml-14">Schedule a new patient visit</p>
                </div>
                
                <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8'>
                    
                    {formData.error && (
                        <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3'>
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <span>{formData.error}</span>
                        </div>
                    )}

                    {/* Patient Lookup */}
                    <div className='mb-6'>
                        <label className='block text-gray-700 font-semibold mb-2' htmlFor="patientSearch">
                            1. Find Patient <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="patientSearch"
                                name="patientSearch"
                                placeholder="Type patient record number or name..."
                                value={patientSearch}
                                onChange={handleSearchChange}
                                className={`w-full p-4 pl-12 border rounded-xl shadow-sm focus:ring-2 focus:border-transparent transition-all ${
                                    formData.patientId === '' && (patientSearch || patientSuggestions.length > 0) 
                                    ? 'border-red-400 bg-red-50 focus:ring-red-500' 
                                    : formData.patientId ? 'border-green-400 bg-green-50 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                autoComplete="off"
                            />
                            <svg className="absolute left-4 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {isPatientSelected && (
                                <div className="absolute right-4 top-4">
                                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {formData.patientId === '' && patientSearch && (
                           <p className="text-red-600 text-sm mt-2">Please select a patient from the list.</p>
                        )}
                        
                        {patientSuggestions.length > 0 && formData.patientId === '' && (
                            <ul className="border border-gray-300 rounded-xl mt-1 max-h-48 overflow-y-auto bg-white shadow-lg">
                                {patientSuggestions.map(patient => (
                                    <li 
                                        key={patient.id} 
                                        onClick={() => handlePatientSelect(patient)}
                                        className="p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                    >
                                        <span className='font-semibold'>{patient.display}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    {/* Clinician Selection */}
                    <div className='mb-6'>
                        <label className='block text-gray-700 font-semibold mb-2' htmlFor="doctorId">
                            2. Assign Clinician <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="doctorId"
                            name="doctorId"
                            onChange={handleChange}
                            value={formData.doctorId}
                            className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                        >
                            <option value="" disabled>Select a clinician...</option>
                            {/* (TS) 19. clinician.id เป็น number */}
                            {clinicians.map(clinician => (
                                <option key={clinician.id} value={clinician.id}>
                                    {clinician.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Date and Time Section */}
                    <div className="mb-6">
                        <label className='block text-gray-700 font-semibold mb-2'>
                            3. Select Time Slot <span className="text-red-500">*</span>
                        </label>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div>
                                <label className='text-sm text-gray-600' htmlFor="date">Date</label>
                                <input 
                                    type="date" 
                                    id="date" 
                                    name="date" 
                                    onChange={handleChange} 
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                                />
                            </div>
                            <div>
                                <label className='text-sm text-gray-600' htmlFor="startTime">Start Time</label>
                                <input 
                                    type="time" 
                                    id="startTime" 
                                    name="startTime" 
                                    onChange={handleChange} 
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                                />
                            </div>
                            <div>
                                <label className='text-sm text-gray-600' htmlFor="endTime">End Time</label>
                                <input 
                                    type="time" 
                                    id="endTime" 
                                    name="endTime" 
                                    onChange={handleChange} 
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reception Notes */}
                    <div className='mb-8'>
                        <label className='block text-gray-700 font-semibold mb-2 flex items-center gap-2' htmlFor="notesReception">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            4. Reception Notes 
                            <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                        </label>
                        <textarea 
                            id="notesReception" 
                            name="notesReception" 
                            rows={4} 
                            placeholder="Add any additional information or reason for visit..." 
                            onChange={handleChange} 
                            className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none'
                        />
                    </div>

                    <button 
                        type="submit" 
                        className='bg-gradient-to-r from-blue-600 to-blue-700 text-white w-full p-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 group'
                    >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Create Appointment
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateAppointmentPage;