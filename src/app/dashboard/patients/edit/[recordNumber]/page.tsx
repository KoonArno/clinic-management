// src/app/dashboard/patients/edit/[recordNumber]/page.tsx
"use client";

// (TS) 1. Import React และ Types
import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

// (TS) 2. Interface สำหรับข้อมูล Patient ที่ดึงมา (จาก API)
interface PatientData {
    firstName: string;
    lastName: string;
    gender: string; // (TS) 3. API ส่งมาเป็น string
    dateOfBirth: string; // ISO String
    allergies: string | null;
    medicalHistory: string | null;
    currentMedications: string | null;
}

// (TS) 4. Interface สำหรับ State ของ Form
interface PatientEditFormData {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other'; // (TS) 5. จำกัดค่า
    dateOfBirth: string; // YYYY-MM-DD (สำหรับ input)
    allergies: string;
    medicalHistory: string;
    currentMedications: string;
}

// (TS) 6. Helper format วันที่
const formatDateForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    // (TS) 7. เพิ่ม try...catch กัน Error
    try {
        return new Date(isoString).toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

// (TS) 8. สร้าง Type สำหรับ Gender
type Gender = 'male' | 'female' | 'other';

function EditPatientPage() {
    const router = useRouter();
    // (TS) 9. กำหนด Type ให้ params
    const params = useParams() as { recordNumber: string };
    const { recordNumber } = params;
    
    const { data: session, status } = useSession();
    
    // (TS) 10. กำหนด Type ให้ State
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
        // (TS) 11. ใช้ Role enum
        if (userRole !== Role.reception && userRole !== Role.admin) {
            setError("You do not have permission to edit patient records.");
            setIsLoading(false);
            return;
        }

        async function fetchPatientData() {
            try {
                const res = await fetch(`http://localhost:3000/api/patients/${recordNumber}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.message || "Failed to fetch patient data.");
                }
                // (TS) 12. กำหนด Type ให้ data
                const data: PatientData = await res.json();
                
                // (TS) 13. Cast gender ที่รับมาให้ตรง Type
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
                
            } catch (err: any) { // (TS) 14. Type error
                console.error("Error fetching patient:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPatientData();
    }, [recordNumber, status, session]);

    // (TS) 15. กำหนด Type ให้ Event
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'gender') {
            setFormData(prev => ({
                ...prev,
                gender: value as Gender, // (TS) 16. Cast value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
        setError('');
    };
    
    // (TS) 17. กำหนด Type ให้ Form Event
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        
        const { firstName, lastName, gender, dateOfBirth } = formData;
        if (!firstName || !lastName || !gender || !dateOfBirth) {
            setError("Please fill in First Name, Last Name, Gender, and Date of Birth.");
            return;
        }

        try {
            // (TS) 18. สร้าง Payload
            const payload = {
                ...formData,
                dateOfBirth: new Date(dateOfBirth).toISOString(), 
            };
            
            const res = await fetch(`http://localhost:3000/api/patients/${recordNumber}`, {
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
            <div className="min-h-screen ...">
                {/* ... (Loading) ... */}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl'>
                <Link href="/dashboard/patients" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Patient Records
                </Link>
                
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">✏️</span>
                        <h1 className='text-4xl font-bold text-gray-900'>Edit Patient Record</h1>
                    </div>
                    <p className="text-xl text-gray-600 ml-14">Record No: <span className="font-mono font-semibold text-indigo-600">{recordNumber}</span></p>
                </div>
                
                <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8'>
                    
                    {error && (
                        <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3'>
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {/* Basic Information Section (เหมือน Create) */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Basic Information
                        </h2>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <label className='...' htmlFor="firstName">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    value={formData.firstName} 
                                    onChange={handleChange} 
                                    className='...'
                                />
                            </div>
                            <div>
                                <label className='...' htmlFor="lastName">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    value={formData.lastName} 
                                    onChange={handleChange} 
                                    className='...'
                                />
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
                            <div className='col-span-1'>
                                <label className='...' htmlFor="gender">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    id="gender" 
                                    name="gender" 
                                    value={formData.gender} 
                                    onChange={handleChange} 
                                    className='...'
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className='col-span-2'>
                                <label className='...' htmlFor="dateOfBirth">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    id="dateOfBirth" 
                                    name="dateOfBirth" 
                                    value={formData.dateOfBirth} 
                                    onChange={handleChange} 
                                    className='...'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information Section (เหมือน Create) */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 ...">
                            {/* ... (Header) ... */}
                        </h2>

                        <div className='space-y-6'>
                            <div>
                                <label className='...' htmlFor="allergies">
                                    {/* ... (Allergies Label) ... */}
                                </label>
                                <textarea 
                                    id="allergies" 
                                    name="allergies" 
                                    rows={3} 
                                    value={formData.allergies} 
                                    onChange={handleChange} 
                                    className='...'
                                />
                            </div>

                            <div>
                                <label className='...' htmlFor="medicalHistory">
                                    {/* ... (Medical History Label) ... */}
                                </label>
                                <textarea 
                                    id="medicalHistory" 
                                    name="medicalHistory" 
                                    rows={4} 
                                    value={formData.medicalHistory} 
                                    onChange={handleChange} 
                                    className='...'
                                />
                            </div>

                            <div>
                                <label className='...' htmlFor="currentMedications">
                                    {/* ... (Current Medications Label) ... */}
                                </label>
                                <textarea 
                                    id="currentMedications" 
                                    name="currentMedications" 
                                    rows={3} 
                                    value={formData.currentMedications} 
                                    onChange={handleChange} 
                                    className='...'
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className='bg-gradient-to-r from-indigo-600 to-indigo-700 ...'
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

export default EditPatientPage;