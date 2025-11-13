// src/app/auth/login/page.tsx
"use client";

// (TS) 1. Import React เพื่อให้ใช้ Type ของ Event ได้
import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; 

function LoginPage() {
    // (TS) 2. กำหนด Type ที่ชัดเจนให้กับ State
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const router = useRouter();

    // (TS) 3. กำหนด Type ของ Form Event
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        
        if(!username || !password) {
            setError("All fields are required");
            return;
        }

        setIsLoading(true);
        try{
            const result = await signIn('credentials', {
                redirect: false,
                username: username,
                password: password,
            });
            
            // (TS) 4. ตรวจสอบว่า result ไม่ใช่ null/undefined ก่อนเข้าถึง .error
            if(result?.error) { 
                setError("Invalid credentials");
            } else {
                setError('');
                router.push("/dashboard"); 
            }
        } catch (error) {
            console.log("An error occurred while logging in");
            setError("An error occurred while logging in");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Navbar />
            <div className='container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]'>
                <div className='w-full max-w-md'>
                    {/* Card Container */}
                    <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
                        {/* Header Section (เหมือนเดิม) */}
                        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8'>
                            <div className="text-center">
                                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">🔐</span>
                                </div>
                                <h2 className='text-3xl font-bold text-white mb-2'>Welcome Back</h2>
                                <p className='text-blue-100'>Sign in to access your clinic dashboard</p>
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
                                            // (TS) 5. Type ของ e ถูกอนุมาน (inferred) เป็น React.ChangeEvent<HTMLInputElement>
                                            onChange={(e) => setUsername(e.target.value)}
                                            value={username}
                                            className='block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400' 
                                            type="text" 
                                            placeholder='Enter your username'
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                
                                {/* Password Field */}
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
                                            className='block w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400' 
                                            type={showPassword ? "text" : "password"}
                                            placeholder='Enter your password'
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Submit Button (เหมือนเดิม) */}
                                <button 
                                    type='submit' 
                                    disabled={isLoading}
                                    className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Sign In</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Footer Section (เหมือนเดิม) */}
                        <div className='px-8 pb-8'>
                            <div className='pt-6 border-t border-gray-100'>
                                <p className='text-center text-gray-600'>
                                    Don't have an account?{' '}
                                    <Link href="/auth/register" className='text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors'>
                                        Sign Up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info (เหมือนเดิม) */}
                    <p className='text-center text-sm text-gray-500 mt-6'>
                        Protected by secure authentication
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage;