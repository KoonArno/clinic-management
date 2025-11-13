// src/app/auth/register/page.tsx
"use client";

// (TS) 1. Import React และ Role enum
import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client'; // (TS) 2. Import Role enum จาก Prisma

// (TS) 3. สร้าง Type สำหรับ Role ที่ใช้ใน State และ Options
// (เราใช้ Role โดยตรงเลยก็ได้ แต่การสร้าง Type แยกช่วยให้อ่านง่ายขึ้น)
type UserRole = Role.clinician | Role.reception | Role.admin;

function RegisterPage() {
    // (TS) 4. กำหนด Type ให้ State
    const [username, setUsername] = useState<string>('');
    const [fullName, setFullName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [role, setRole] = useState<UserRole>(Role.clinician); // (TS) 5. ใช้ Type ที่กำหนด
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    
    const router = useRouter(); 

    // (TS) 6. กำหนด Type ให้ Form Event
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        
        if(password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        if(!username || !fullName || !password || !confirmPassword || !role) {
            setError("All fields are required");
            return;
        }

        if(password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try{
            // (TS) 7. สร้าง Payload ให้มี Type ตรงกับที่ API คาดหวัง
            // (API ที่เราแปลงแล้ว คาดหวัง Role เป็น enum)
            const payload = {
                username, 
                fullName, 
                password, 
                role 
            };

            const res = await fetch("http://localhost:3000/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload), // (TS) 8. ส่ง Payload ที่มี Type
            });
            
            if(res.ok) {
                const form = e.target as HTMLFormElement; // (TS) 9. Cast e.target
                setError('');
                alert("User registered successfully! You will be redirected to the login page.");
                form.reset();
                setRole(Role.clinician); // (TS) 10. ใช้ enum
                router.push("/auth/login");
            } else {
                const data = await res.json();
                setError(data.message || "User registration failed");
            }
        } catch (error) {
            console.log("An error occurred while registering");
            setError("An error occurred while registering");
        } finally {
            setIsLoading(false);
        }
    }

    // (TS) 11. สร้าง Interface สำหรับ roleOptions
    interface RoleOption {
        value: UserRole;
        label: string;
        icon: string;
        description: string;
    }

    // (TS) 12. ใช้ Role enum และ Interface
    const roleOptions: RoleOption[] = [
        { value: Role.clinician, label: 'Clinician', icon: '👨‍⚕️', description: 'Medical practitioner' },
        { value: Role.reception, label: 'Reception', icon: '👨‍💼', description: 'Front desk staff' },
        { value: Role.admin, label: 'Admin', icon: '👑', description: 'System administrator' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]'>
                <div className='w-full max-w-2xl'>
                    {/* Card Container */}
                    <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
                        {/* Header Section (เหมือนเดิม) */}
                        <div className='bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-8'>
                            <div className="text-center">
                                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">✨</span>
                                </div>
                                <h2 className='text-3xl font-bold text-white mb-2'>Create Account</h2>
                                <p className='text-green-100'>Join our clinic management system</p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className='px-8 py-8'>
                            <form onSubmit={handleSubmit} className='space-y-5'>
                                {error && (
                                    <div className='bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 animate-shake'>
                                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className='text-sm font-medium'>{error}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Username Field */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                            Username
                                        </label>
                                        <div className='relative'>
                                            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <input 
                                                // (TS) 13. Type ของ e ถูกอนุมาน (inferred)
                                                onChange={(e) => setUsername(e.target.value)}
                                                value={username}
                                                className='block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400' 
                                                type="text" 
                                                placeholder='Username for login'
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Full Name Field */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                            Full Name
                                        </label>
                                        <div className='relative'>
                                            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <input 
                                                onChange={(e) => setFullName(e.target.value)}
                                                value={fullName}
                                                className='block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400' 
                                                type="text" 
                                                placeholder='Your full name'
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Password Field (เหมือนเดิม) */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                            Password
                                        </label>
                                        <div className='relative'>
                                            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <input 
                                                onChange={(e) => setPassword(e.target.value)}
                                                value={password}
                                                className='block w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400' 
                                                type={showPassword ? "text" : "password"}
                                                placeholder='Create password'
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
                                            >
                                                {/* (SVGs) */}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password Field (เหมือนเดิม) */}
                                    <div>
                                        <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                            Confirm Password
                                        </label>
                                        <div className='relative'>
                                            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <input 
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                value={confirmPassword}
                                                className='block w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400' 
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder='Confirm password'
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
                                            >
                                                {/* (SVGs) */}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                                        Select Your Role
                                    </label>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                        {roleOptions.map((option) => (
                                            <label 
                                                key={option.value}
                                                className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                                    role === option.value 
                                                        ? 'border-green-500 bg-green-50 shadow-md' 
                                                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="role" 
                                                    value={option.value}
                                                    checked={role === option.value}
                                                    // (TS) 14. Cast e.target.value ให้เป็น UserRole
                                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                                    className='sr-only'
                                                    disabled={isLoading}
                                                />
                                                <span className="text-3xl mb-2">{option.icon}</span>
                                                <span className={`font-semibold text-sm mb-1 ${role === option.value ? 'text-green-700' : 'text-gray-700'}`}>
                                                    {option.label}
                                                </span>
                                                <span className="text-xs text-gray-500 text-center">{option.description}</span>
                                                {role === option.value && (
                                                    <div className="absolute top-2 right-2">
                                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button (เหมือนเดิม) */}
                                <button 
                                    type='submit' 
                                    disabled={isLoading}
                                    className='w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                            <span>Create Account</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Footer Section (เหมือนเดิม) */}
                        <div className='px-8 pb-8'>
                            <div className='pt-6 border-t border-gray-100'>
                                <p className='text-center text-gray-600'>
                                    Already have an account?{' '}
                                    <Link href="/auth/login" className='text-green-600 hover:text-green-800 font-semibold hover:underline transition-colors'>
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info (เหมือนเดิม) */}
                    <p className='text-center text-sm text-gray-500 mt-6'>
                        By creating an account, you agree to our terms of service
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage;