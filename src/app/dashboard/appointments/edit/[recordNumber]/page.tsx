// src/app/dashboard/appointments/edit/[recordNumber]/page.tsx
"use client";

// (TS) 1. Import React และ Types/Enums
import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role, AppointmentStatus } from '@prisma/client';

// (TS) 2. Interface สำหรับ Clinician
interface Clinician {
    id: number;
    username: string;
    fullName: string;
}

// (TS) 3. Interface สำหรับข้อมูล Appointment ที่ดึงมา (จาก API)
interface AppointmentData {
    startTime: string; // ISO
    endTime: string; // ISO
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

// (TS) 4. Interface สำหรับ State ของ Form
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

// (TS) 5. Helper format วันที่ (สำคัญ: แปลงเป็น Local Time สำหรับ Input)
const extractLocalDatetimeParts = (isoString: string | null): { date: string; time: string } => {
    if (!isoString) return { date: '', time: '' };
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return { date: '', time: '' };
        
        // (TS) 6. แปลงเป็น Local ISO String (โค้ดเดิม)
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
    // (TS) 7. กำหนด Type params
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;
    
    const { data: session, status } = useSession();
    
    // (TS) 8. กำหนด Type State
    const [formData, setFormData] = useState<AppointmentEditFormData>({
        patientId: '', 
        doctorId: '',  
        date: '',
        startTime: '',
        endTime: '',
        notesReception: '',
        status: AppointmentStatus.PENDING, // (TS) 9. ใช้ enum
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
                // Fetch Clinicians
                const cliniciansRes = await fetch("http://localhost:3000/api/users/clinicians");
                if (cliniciansRes.ok) {
                    // (TS) 10. Type data
                    const data: Clinician[] = await cliniciansRes.json();
                    setClinicians(data);
                }
                
                // Fetch Appointment Data
                const aptRes = await fetch(`http://localhost:3000/api/appointments/${recordNumber}`);
                if (!aptRes.ok) {
                    throw new Error('Failed to load appointment data.');
                }
                
                // (TS) 11. Type data
                const aptData: AppointmentData = await aptRes.json();
                
                const userRole = session.user.role;
                // (TS) 12. ใช้ Role enum และ session.user.id
                if (userRole === Role.clinician && aptData.doctorDetails.id !== session.user.id) {
                    throw new Error("You do not have permission to edit this appointment.");
                }

                const startParts = extractLocalDatetimeParts(aptData.startTime);
                const endParts = extractLocalDatetimeParts(aptData.endTime);
                
                setFormData(prev => ({ 
                    ...prev,
                    patientId: aptData.patientDetails.id, 
                    doctorId: String(aptData.doctorDetails.id), // (TS) 13. แปลงเป็น string สำหรับ <select>
                    date: startParts.date,
                    startTime: startParts.time,
                    endTime: endParts.time,
                    notesReception: aptData.notesReception || '',
                    status: aptData.status,
                    notesDoctor: aptData.notesDoctor || '',
                }));
                
                setPatientDisplay(`${aptData.patientDetails.recordNumber} - ${aptData.patientDetails.firstName} ${aptData.patientDetails.lastName}`); 
                
            } catch (err: any) { // (TS) 14. Type error
                console.error("Error fetching data:", err);
                setSubmissionError(err.message || "Failed to load appointment data.");
            } finally {
                setIsLoaded(true);
            }
        }
        fetchData();
    }, [recordNumber, status, session]);
    
    // (TS) 15. กำหนด Type Event
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // (TS) 16. Cast value ถ้าเป็น status
        if (name === 'status') {
             setFormData({ ...formData, [name]: value as AppointmentStatus });
        } else {
             setFormData({ ...formData, [name]: value });
        }
        setSubmissionError(null);
    };
    
    // (TS) 17. กำหนด Type Form Event
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmissionError(null);
        
        // (TS) 18. session.user.role มี Type ที่ถูกต้อง
        const userRole = session?.user?.role;
        if (!userRole) {
            setSubmissionError("Session invalid. Please log in again.");
            return;
        }

        const startDateTime = new Date(`${formData.date} ${formData.startTime}`).toISOString();
        const endDateTime = new Date(`${formData.date} ${formData.endTime}`).toISOString();

        // (TS) 19. สร้าง Payload (Type any เพราะ Logic ซับซ้อนตาม Role)
        const payload: any = {};
        
        // (TS) 20. ใช้ Role enum
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
                router.push(`/dashboard/appointments/${recordNumber}`); // (TS) 21. กลับไปหน้า Detail
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
    // (TS) 22. ใช้ Role enum
    const isReception = userRole === Role.reception;
    const isClinician = userRole === Role.clinician;

    if (!isLoaded || status === "loading") {
        return (
            <div className="min-h-screen ...">
                {/* ... (Loading) ... */}
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl'>
                <Link href={`/dashboard/appointments/${recordNumber}`} className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Appointment Detail
                </Link>
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">✏️</span>
                        <h1 className='text-4xl font-bold text-gray-900'>Edit Appointment</h1>
                    </div>
                    <p className="text-xl text-gray-600 ml-14">Record No: <span className="font-mono font-semibold text-indigo-600">{recordNumber}</span></p>
                </div>
                
                <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8'>
                    
                    {submissionError && (
                        <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3'>
                            {/* ... (Error) ... */}
                            <span>{submissionError}</span>
                        </div>
                    )}

                    {/* Patient Display (Read-only) */}
                    <div className='mb-6'>
                        <label className='block text-gray-700 font-semibold mb-2'>Patient</label>
                        <div className="w-full p-4 border border-gray-200 bg-gray-100 rounded-xl shadow-sm flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-gray-700 font-medium">{patientDisplay}</span>
                        </div>
                    </div>
                    
                    {/* Clinician Selection */}
                    <div className='mb-6'>
                        <label className='block text-gray-700 font-semibold mb-2' htmlFor="doctorId">Clinician</label>
                        <select
                            id="doctorId"
                            name="doctorId"
                            onChange={handleChange}
                            value={formData.doctorId} 
                            disabled={isClinician}
                            className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                isClinician ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                            }`}
                        >
                            <option value="" disabled>Select Clinician</option>
                            {/* (TS) 23. API /users/clinicians ส่ง fullName มา */}
                            {clinicians.map(clinician => (
                                <option key={clinician.id} value={clinician.id}>
                                    {clinician.fullName}
                                </option>
                            ))}
                        </select>
                        {isClinician && (
                           <p className="text-gray-500 text-sm mt-2">Clinicians cannot reassign appointments</p>
                        )}
                    </div>

                    {/* Status Selection */}
                    <div className='mb-6'>
                        <label className='block text-gray-700 font-semibold mb-2' htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            onChange={handleChange}
                            value={formData.status} 
                            disabled={isReception}
                            className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                isReception ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                            }`}
                        >
                            {/* (TS) 24. ใช้ค่าจาก enum */}
                            <option value={AppointmentStatus.PENDING}>PENDING</option>
                            <option value={AppointmentStatus.COMPLETED}>COMPLETED</option>
                        </select>
                        {isReception && (
                            <p className="text-gray-500 text-sm mt-2">Only clinicians can update appointment status</p>
                        )}
                    </div>
                    
                    {/* Date and Time Section (Inputs) */}
                    <div className="mb-6">
                        <label className='block text-gray-700 font-semibold mb-2'>Time Slot</label>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div>
                                <label className='text-sm text-gray-600' htmlFor="date">Date</label>
                                <input 
                                    type="date" 
                                    id="date" 
                                    name="date" 
                                    onChange={handleChange} 
                                    value={formData.date} 
                                    disabled={isClinician} 
                                    className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        isClinician ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className='text-sm text-gray-600' htmlFor="startTime">Start Time</label>
                                <input 
                                    type="time" 
                                    id="startTime" 
                                    name="startTime" 
                                    onChange={handleChange} 
                                    value={formData.startTime} 
                                    disabled={isClinician}
                                    className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        isClinician ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className='text-sm text-gray-600' htmlFor="endTime">End Time</label>
                                <input 
                                    type="time" 
                                    id="endTime" 
                                    name="endTime" 
                                    onChange={handleChange} 
                                    value={formData.endTime} 
                                    disabled={isClinician}
                                    className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        isClinician ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reception Notes (Textarea) */}
                    <div className='mb-6'>
                        <label className='block text-gray-700 font-semibold mb-2 flex items-center gap-2' htmlFor="notesReception">
                            Reception Notes
                        </label>
                        <textarea 
                            id="notesReception" 
                            name="notesReception" 
                            rows={3} 
                            onChange={handleChange} 
                            value={formData.notesReception} 
                            disabled={isClinician} 
                            className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                                isClinician ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                            }`}
                        />
                    </div>
                    
                    {/* Clinician Notes (Textarea) */}
                    <div className='mb-8'>
                        <label className='block text-gray-700 font-semibold mb-2 flex items-center gap-2' htmlFor="notesDoctor">
                            Clinician Notes
                        </label>
                        <textarea 
                            id="notesDoctor" 
                            name="notesDoctor" 
                            rows={4} 
                            onChange={handleChange} 
                            value={formData.notesDoctor} 
                            disabled={isReception}
                            placeholder={isReception ? "Cannot be edited by Reception" : "Add clinical notes, diagnosis, etc..."}
                            className={`w-full p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                                isReception ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                            }`}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className='bg-gradient-to-r from-indigo-600 to-indigo-700 text-white w-full p-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2 group'
                    >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditAppointmentPage;