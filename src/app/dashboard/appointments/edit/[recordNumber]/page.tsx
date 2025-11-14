// src/app/dashboard/appointments/edit/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

interface Clinician {
    id: number;
    username: string;
    fullName: string;
}

interface AppointmentData {
    startTime: string;
    endTime: string;
    notesReception: string | null;
    status: AppointmentStatus;
    notesDoctor: string | null;
    patientDetails: {
        id: number;
        recordNumber: string;
        firstName: string;
        lastName: string;
    };
    doctorDetails: {
        id: number;
        username: string; 
    };
}

interface AppointmentEditFormData {
    patientId: number | string; 
    doctorId: number | string;
    date: string;
    startTime: string;
    endTime: string;
    notesReception: string;
    status: AppointmentStatus;
    notesDoctor: string;
}

const extractLocalDatetimeParts = (isoString: string | null): { date: string; time: string } => {
    if (!isoString) return { date: '', time: '' };
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return { date: '', time: '' };
        
        const localIsoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
        const parts = localIsoString.split('T');
        const timeParts = parts[1].split(':');
        
        return {
            date: parts[0],
            time: `${timeParts[0]}:${timeParts[1]}`,
        };
    } catch {
        return { date: '', time: '' };
    }
};

function EditAppointmentPage() {
    const router = useRouter();
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;
    
    const { data: session, status } = useSession();
    
    const [formData, setFormData] = useState<AppointmentEditFormData>({
        patientId: '', 
        doctorId: '',  
        date: '',
        startTime: '',
        endTime: '',
        notesReception: '',
        status: AppointmentStatus.PENDING,
        notesDoctor: '',
    });
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [patientDisplay, setPatientDisplay] = useState<string>("Loading patient...");
    const [clinicians, setClinicians] = useState<Clinician[]>([]);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    
    useEffect(() => {
        if (!recordNumber || status !== "authenticated") return;

        async function fetchData() {
            try {
                const cliniciansRes = await fetch("http://localhost:3000/api/users/clinicians");
                if (cliniciansRes.ok) {
                    const data: Clinician[] = await cliniciansRes.json();
                    setClinicians(data);
                }
                
                const aptRes = await fetch(`http://localhost:3000/api/appointments/${recordNumber}`);
                if (!aptRes.ok) {
                    throw new Error('Failed to load appointment data.');
                }
                
                const aptData: AppointmentData = await aptRes.json();
                
                const userRole = session.user.role;
                if (userRole === Role.clinician && aptData.doctorDetails.id !== session.user.id) {
                    throw new Error("You do not have permission to edit this appointment.");
                }

                const startParts = extractLocalDatetimeParts(aptData.startTime);
                const endParts = extractLocalDatetimeParts(aptData.endTime);
                
                setFormData(prev => ({ 
                    ...prev,
                    patientId: aptData.patientDetails.id, 
                    doctorId: String(aptData.doctorDetails.id),
                    date: startParts.date,
                    startTime: startParts.time,
                    endTime: endParts.time,
                    notesReception: aptData.notesReception || '',
                    status: aptData.status,
                    notesDoctor: aptData.notesDoctor || '',
                }));
                
                setPatientDisplay(`${aptData.patientDetails.recordNumber} - ${aptData.patientDetails.firstName} ${aptData.patientDetails.lastName}`); 
                
            } catch (err: any) {
                console.error("Error fetching data:", err);
                setSubmissionError(err.message || "Failed to load appointment data.");
            } finally {
                setIsLoaded(true);
            }
        }
        fetchData();
    }, [recordNumber, status, session]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'status') {
             setFormData({ ...formData, [name]: value as AppointmentStatus });
        } else {
             setFormData({ ...formData, [name]: value });
        }
        setSubmissionError(null);
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmissionError(null);
        
        const userRole = session?.user?.role;
        if (!userRole) {
            setSubmissionError("Session invalid. Please log in again.");
            return;
        }

        const startDateTime = new Date(`${formData.date} ${formData.startTime}`).toISOString();
        const endDateTime = new Date(`${formData.date} ${formData.endTime}`).toISOString();

        const payload: any = {};
        
        if (userRole === Role.reception || userRole === Role.admin) {
            payload.patientId = formData.patientId;
            payload.doctorId = parseInt(String(formData.doctorId));
            payload.startTime = startDateTime;
            payload.endTime = endDateTime;
            payload.notesReception = formData.notesReception;
        }
        
        if (userRole === Role.clinician || userRole === Role.admin) {
            payload.status = formData.status;
            payload.notesDoctor = formData.notesDoctor;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/appointments/${recordNumber}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                alert(`Appointment ${recordNumber} updated successfully!`);
                router.push(`/dashboard/appointments/${recordNumber}`);
            } else {
                const data = await res.json();
                setSubmissionError(data.message || "Failed to update appointment.");
            }

        } catch (error) {
            console.error("Error updating appointment:", error);
            setSubmissionError("An error occurred while connecting to the server.");
        }
    };
    
    const userRole = session?.user?.role;
    const isReception = userRole === Role.reception;
    const isClinician = userRole === Role.clinician;

    if (!isLoaded || status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <Navbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="inline-block relative">
                            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
                        </div>
                        <p className="text-gray-700 mt-6 font-semibold text-xl">Loading appointment...</p>
                    </div>
                </div>
            </div>
        );
    }
    
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
                <Link href={`/dashboard/appointments/${recordNumber}`} className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Appointment Detail
                </Link>
                
                <div className="mb-10 animate-fade-in-down">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-4 rounded-3xl shadow-2xl">
                            <span className="text-5xl">✏️</span>
                        </div>
                        <div>
                            <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'>
                                Edit Appointment
                            </h1>
                            <p className="text-xl text-gray-700 font-semibold mt-2">
                                Record No: <span className="font-mono font-black text-indigo-600">{recordNumber}</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className='bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10 animate-fade-in'>
                    
                    {submissionError && (
                        <div className='bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-700 p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-lg'>
                            <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <span className="font-semibold">{submissionError}</span>
                        </div>
                    )}

                    {/* Patient Display */}
                    <div className='mb-8'>
                        <label className='block text-gray-900 font-black text-lg mb-3'>Patient</label>
                        <div className="w-full p-5 border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg flex items-center gap-3">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-gray-900 font-bold">{patientDisplay}</span>
                        </div>
                    </div>
                    
                    {/* Clinician Selection */}
                    <div className='mb-8'>
                        <label className='block text-gray-900 font-black text-lg mb-3' htmlFor="doctorId">Clinician</label>
                        <select
                            id="doctorId"
                            name="doctorId"
                            onChange={handleChange}
                            value={formData.doctorId} 
                            disabled={isClinician}
                            className={`w-full p-5 border-2 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-bold ${
                                isClinician ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                            }`}
                        >
                            <option value="" disabled>Select Clinician</option>
                            {clinicians.map(clinician => (
                                <option key={clinician.id} value={clinician.id}>
                                    {clinician.fullName}
                                </option>
                            ))}
                        </select>
                        {isClinician && (
                           <p className="text-gray-600 text-sm mt-2 font-semibold italic">Clinicians cannot reassign appointments</p>
                        )}
                    </div>

                    {/* Status Selection */}
                    <div className='mb-8'>
                        <label className='block text-gray-900 font-black text-lg mb-3' htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            onChange={handleChange}
                            value={formData.status} 
                            disabled={isReception}
                            className={`w-full p-5 border-2 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-bold ${
                                isReception ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                            }`}
                        >
                            <option value={AppointmentStatus.PENDING}>PENDING</option>
                            <option value={AppointmentStatus.COMPLETED}>COMPLETED</option>
                        </select>
                        {isReception && (
                            <p className="text-gray-600 text-sm mt-2 font-semibold italic">Only clinicians can update appointment status</p>
                        )}
                    </div>
                    
                    {/* Date and Time Section */}
                    <div className="mb-8">
                        <label className='block text-gray-900 font-black text-lg mb-3'>Time Slot</label>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                            <div>
                                <label className='text-sm font-bold text-gray-600 mb-2 block' htmlFor="date">Date</label>
                                <input 
                                    type="date" 
                                    id="date" 
                                    name="date" 
                                    onChange={handleChange} 
                                    value={formData.date} 
                                    disabled={isClinician} 
                                    className={`w-full p-5 border-2 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-semibold ${
                                        isClinician ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className='text-sm font-bold text-gray-600 mb-2 block' htmlFor="startTime">Start Time</label>
                                <input 
                                    type="time" 
                                    id="startTime" 
                                    name="startTime" 
                                    onChange={handleChange} 
                                    value={formData.startTime} 
                                    disabled={isClinician}
                                    className={`w-full p-5 border-2 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-semibold ${
                                        isClinician ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className='text-sm font-bold text-gray-600 mb-2 block' htmlFor="endTime">End Time</label>
                                <input 
                                    type="time" 
                                    id="endTime" 
                                    name="endTime" 
                                    onChange={handleChange} 
                                    value={formData.endTime} 
                                    disabled={isClinician}
                                    className={`w-full p-5 border-2 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all font-semibold ${
                                        isClinician ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reception Notes */}
                    <div className='mb-8'>
                        <label className='block text-gray-900 font-black text-lg mb-3 flex items-center gap-2' htmlFor="notesReception">
                            Reception Notes
                        </label>
                        <textarea 
                            id="notesReception" 
                            name="notesReception" 
                            rows={4} 
                            onChange={handleChange} 
                            value={formData.notesReception} 
                            disabled={isClinician} 
                            className={`w-full p-5 border-2 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all resize-none font-medium ${
                                isClinician ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                            }`}
                        />
                    </div>
                    
                    {/* Clinician Notes */}
                    <div className='mb-10'>
                        <label className='block text-gray-900 font-black text-lg mb-3 flex items-center gap-2' htmlFor="notesDoctor">
                            Clinician Notes
                        </label>
                        <textarea 
                            id="notesDoctor" 
                            name="notesDoctor" 
                            rows={5} 
                            onChange={handleChange} 
                            value={formData.notesDoctor} 
                            disabled={isReception}
                            placeholder={isReception ? "Cannot be edited by Reception" : "Add clinical notes, diagnosis, etc..."}
                            className={`w-full p-5 border-2 rounded-2xl shadow-lg focus:ring-4 focus:ring-indigo-300 focus:border-transparent transition-all resize-none font-medium ${
                                isReception ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                            }`}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className='bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-700 text-white w-full p-5 rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden'
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <svg className="w-7 h-7 group-hover:scale-110 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="relative z-10">Save Changes</span>
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

export default EditAppointmentPage;