// src/app/dashboard/patients/create/page.tsx
"use client";

// (TS) 1. Import React
import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// (TS) 2. สร้าง Interface สำหรับ State ของ Form
// (สอดคล้องกับ API /api/patients ที่เราสร้าง)
interface PatientFormData {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other'; // (TS) 3. จำกัดค่า gender
    dateOfBirth: string; // (TS) 4. รับเป็น string จาก input type="date"
    allergies: string;
    medicalHistory: string;
    currentMedications: string;
    error: string; // (TS) 5. รวม error ไว้ใน State ด้วย
}

// (TS) 6. สร้าง Type สำหรับ gender โดยเฉพาะ (เพื่อใช้ใน handleChange)
type Gender = 'male' | 'female' | 'other';

function CreatePatientPage() {
    const router = useRouter();
    // (TS) 7. ใช้ Interface กับ useState
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

    // (TS) 8. กำหนด Type ให้ Event (สามารถใช้กับ Input, Select, Textarea)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'gender') {
            // (TS) 9. Cast 'value' ให้เป็น Type Gender ที่เราสร้าง
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
    
    // (TS) 10. กำหนด Type ให้ Form Event
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const { firstName, lastName, gender, dateOfBirth } = formData;
        if (!firstName || !lastName || !gender || !dateOfBirth) {
            setFormData({ ...formData, error: "Please fill in First Name, Last Name, Gender, and Date of Birth." });
            return;
        }

        try {
            // (TS) 11. สร้าง Payload ที่จะส่ง (ไม่ต้องส่ง error)
            // และแปลง dateOfBirth เป็น ISO String
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
                body: JSON.stringify(payload), // (TS) 12. ส่ง payload ที่ Type ถูกต้อง
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
                        <span className="text-4xl">🧑</span>
                        <h1 className='text-4xl font-bold text-gray-900'>Add New Patient</h1>
                    </div>
                    <p className="text-gray-600 text-lg ml-14">Create a new patient record in the system</p>
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

                    {/* Basic Information Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Basic Information
                        </h2>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <label className='block text-gray-700 font-semibold mb-2' htmlFor="firstName">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    name="firstName" 
                                    value={formData.firstName}
                                    onChange={handleChange} 
                                    placeholder="John" 
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                                />
                            </div>
                            <div>
                                <label className='block text-gray-700 font-semibold mb-2' htmlFor="lastName">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    name="lastName" 
                                    value={formData.lastName}
                                    onChange={handleChange} 
                                    placeholder="Doe" 
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                                />
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
                            <div className='col-span-1'>
                                <label className='block text-gray-700 font-semibold mb-2' htmlFor="gender">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    id="gender" 
                                    name="gender" 
                                    value={formData.gender}
                                    onChange={handleChange} // (TS) 13. handleChange (HTMLSelectElement)
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className='col-span-2'>
                                <label className='block text-gray-700 font-semibold mb-2' htmlFor="dateOfBirth">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    id="dateOfBirth" 
                                    name="dateOfBirth" 
                                    value={formData.dateOfBirth}
                                    onChange={handleChange} // (TS) 14. handleChange (HTMLInputElement)
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Medical Information
                            <span className="text-gray-400 text-sm font-normal ml-2">(Optional)</span>
                        </h2>

                        <div className='space-y-6'>
                            <div>
                                <label className='block text-gray-700 font-semibold mb-2 flex items-center gap-2' htmlFor="allergies">
                                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Allergies
                                </label>
                                <textarea 
                                    id="allergies" 
                                    name="allergies" 
                                    rows={3} 
                                    value={formData.allergies}
                                    onChange={handleChange} // (TS) 15. handleChange (HTMLTextAreaElement)
                                    placeholder="e.g., Allergy to Penicillin, Peanuts" 
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none'
                                />
                            </div>

                            <div>
                                <label className='block text-gray-700 font-semibold mb-2 flex items-center gap-2' htmlFor="medicalHistory">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none'
                                />
                            </div>

                            <div>
                                <label className='block text-gray-700 font-semibold mb-2 flex items-center gap-2' htmlFor="currentMedications">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className='w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none'
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className='bg-gradient-to-r from-green-600 to-green-700 text-white w-full p-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-2 group'
                    >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Save Patient Record
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreatePatientPage;