// src/app/dashboard/appointments/edit/[recordNumber]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';
import { config } from '@/lib/config';

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
                const cliniciansRes = await fetch(`${config.apiBaseUrl}/api/users/clinicians`);
                if (cliniciansRes.ok) {
                    const data: Clinician[] = await cliniciansRes.json();
                    setClinicians(data);
                }

                const aptRes = await fetch(`${config.apiBaseUrl}/api/appointments/${recordNumber}`);
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
            const res = await fetch(`${config.apiBaseUrl}/api/appointments/${recordNumber}`, {
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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block relative">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-slate-500 mt-4 font-medium">Loading appointment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-4xl mx-auto'>
            <Link href={`/dashboard/appointments/${recordNumber}`} className='inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-slate-100'>
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Appointment Detail
            </Link>

            <div className="mb-8 animate-fade-in-down">
                <div className="flex items-center gap-4 mb-3">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                        <span className="text-3xl">✏️</span>
                    </div>
                    <div>
                        <h1 className='text-3xl font-bold text-slate-900'>
                            Edit Appointment
                        </h1>
                        <p className="text-lg text-slate-500 font-medium mt-1">
                            Record No: <span className="font-mono font-bold text-slate-700">{recordNumber}</span>
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in'>

                {submissionError && (
                    <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8 flex items-start gap-3'>
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{submissionError}</span>
                    </div>
                )}

                {/* Patient Display */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2'>Patient</label>
                    <div className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl flex items-center gap-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-slate-700 font-semibold">{patientDisplay}</span>
                    </div>
                </div>

                {/* Clinician Selection */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2' htmlFor="doctorId">Clinician</label>
                    <select
                        id="doctorId"
                        name="doctorId"
                        onChange={handleChange}
                        value={formData.doctorId}
                        disabled={isClinician}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-900 ${isClinician ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-500' : 'border-slate-300 bg-white'
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
                        <p className="text-slate-500 text-xs mt-1 font-medium italic">Clinicians cannot reassign appointments</p>
                    )}
                </div>

                {/* Status Selection */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2' htmlFor="status">Status</label>
                    <select
                        id="status"
                        name="status"
                        onChange={handleChange}
                        value={formData.status}
                        disabled={isReception}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-900 ${isReception ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-500' : 'border-slate-300 bg-white'
                            }`}
                    >
                        <option value={AppointmentStatus.PENDING}>PENDING</option>
                        <option value={AppointmentStatus.COMPLETED}>COMPLETED</option>
                    </select>
                    {isReception && (
                        <p className="text-slate-500 text-xs mt-1 font-medium italic">Only clinicians can update appointment status</p>
                    )}
                </div>

                {/* Date and Time Section */}
                <div className="mb-8">
                    <label className='block text-slate-900 font-bold text-base mb-2'>Time Slot</label>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <label className='text-xs font-semibold text-slate-500 mb-1 block' htmlFor="date">Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                onChange={handleChange}
                                value={formData.date}
                                disabled={isClinician}
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-900 ${isClinician ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-500' : 'border-slate-300 bg-white'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className='text-xs font-semibold text-slate-500 mb-1 block' htmlFor="startTime">Start Time</label>
                            <input
                                type="time"
                                id="startTime"
                                name="startTime"
                                onChange={handleChange}
                                value={formData.startTime}
                                disabled={isClinician}
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-900 ${isClinician ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-500' : 'border-slate-300 bg-white'
                                    }`}
                            />
                        </div>
                        <div>
                            <label className='text-xs font-semibold text-slate-500 mb-1 block' htmlFor="endTime">End Time</label>
                            <input
                                type="time"
                                id="endTime"
                                name="endTime"
                                onChange={handleChange}
                                value={formData.endTime}
                                disabled={isClinician}
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-900 ${isClinician ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-500' : 'border-slate-300 bg-white'
                                    }`}
                            />
                        </div>
                    </div>
                </div>

                {/* Reception Notes */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2 flex items-center gap-2' htmlFor="notesReception">
                        Reception Notes
                    </label>
                    <textarea
                        id="notesReception"
                        name="notesReception"
                        rows={4}
                        onChange={handleChange}
                        value={formData.notesReception}
                        disabled={isClinician}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none font-medium text-slate-900 ${isClinician ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-500' : 'border-slate-300 bg-white'
                            }`}
                    />
                </div>

                {/* Clinician Notes */}
                <div className='mb-8'>
                    <label className='block text-slate-900 font-bold text-base mb-2 flex items-center gap-2' htmlFor="notesDoctor">
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
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none font-medium text-slate-900 ${isReception ? 'bg-slate-100 cursor-not-allowed border-slate-200 text-slate-500' : 'border-slate-300 bg-white'
                            }`}
                    />
                </div>

                <button
                    type="submit"
                    className='bg-emerald-600 text-white w-full py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2'
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                </button>
            </form>
        </div>
    );
}

export default EditAppointmentPage;