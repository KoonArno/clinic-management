// src/app/dashboard/patients/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

interface PatientData {
  id: number;
  recordNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  allergies: string | null;
  medicalHistory: string | null;
  currentMedications: string | null;
}

function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter(); 

  const fetchPatients = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/patients");
      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.statusText}`);
      }
      const data: PatientData[] = await response.json();
      setPatients(data);
      setFilteredPatients(data);
    } catch (err: any) {
      console.error("Fetching error:", err);
      setError("Failed to load patient data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    if (status === "authenticated") {
        fetchPatients();
    } else if (status === "loading") {
        setIsLoading(true);
    } else {
        setIsLoading(false);
        setError("Please log in to view patient data.");
    }
  }, [fetchPatients, status]);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const recordNumber = patient.recordNumber.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || recordNumber.includes(search);
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const handleRowClick = useCallback((recordNumber: string) => {
    router.push(`/dashboard/patients/${recordNumber}`);
  }, [router]);

  const handleDelete = useCallback(async (
    event: React.MouseEvent<HTMLButtonElement>, 
    recordNumber: string, 
    patientName: string
  ) => {
    event.stopPropagation();

    if (!confirm(`Are you sure you want to delete the record for ${patientName} (${recordNumber})? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/patients/${recordNumber}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete record.');
      }

      alert(`Patient record ${recordNumber} has been deleted successfully.`);
      fetchPatients(); 

    } catch (err: any) {
      console.error("Deletion error:", err);
      alert(`Error deleting patient: ${err.message}`);
    }

  }, [fetchPatients]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const canManagePatients = userRole === Role.reception || userRole === Role.admin;

  const renderTableContent = (): React.JSX.Element => {
    if (isLoading || status === "loading") {
      return (
        <div className="text-center py-16">
          <div className="inline-block relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <p className="text-gray-600 mt-6 font-medium text-lg">Loading patient records...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-8 text-center backdrop-blur-sm">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700 font-semibold text-lg">{error}</p>
        </div>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center backdrop-blur-sm">
          <div className="bg-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-700 text-xl font-bold mb-2">
            {searchTerm ? 'No patients found matching your search' : 'No patient records found'}
          </p>
          {canManagePatients && !searchTerm && (
            <p className="text-gray-500 text-lg">Click "Add New Patient" to get started</p>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Record No.</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Date of Birth</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-700 uppercase tracking-wider">Allergies</th>
                {canManagePatients && (
                  <th className="px-6 py-5 text-right text-xs font-black text-gray-700 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
              {filteredPatients.map((patient, index) => {
                  const fullName = `${patient.firstName} ${patient.lastName}`;
                  return (
                      <tr 
                          key={patient.recordNumber}
                          onClick={() => handleRowClick(patient.recordNumber)}
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 transition-all duration-300 group transform hover:scale-[1.01]" 
                      >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="text-sm font-mono font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600">
                              {patient.recordNumber}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="text-white font-black text-base">{patient.firstName?.[0] || ''}{patient.lastName?.[0] || ''}</span>
                              </div>
                              <div className="ml-4">
                                <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-700">{fullName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold capitalize shadow-md
                              ${patient.gender === 'male' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 
                                patient.gender === 'female' ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white' : 
                                'bg-gray-200 text-gray-800'}`}>
                              {patient.gender}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-700">{formatDate(patient.dateOfBirth)}</td>
                          <td className="px-6 py-5 text-sm text-gray-600 max-w-xs">
                            <div className="truncate font-medium">
                              {patient.allergies || <span className="text-gray-400 italic">None</span>}
                            </div>
                          </td>
                          
                          {canManagePatients && (
                              <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                      onClick={(e) => handleDelete(e, patient.recordNumber, fullName)}
                                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                      title={`Delete ${fullName}`}
                                  >
                                      Delete
                                  </button>
                              </td>
                          )}
                      </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <Navbar />
        
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10'>
            <Link href="/dashboard" className='inline-flex items-center gap-2 text-indigo-600 hover:text-purple-600 font-bold mb-8 transition-all group bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg'>
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
            </Link>
            
            <div className='flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-10 animate-fade-in-down'>
                <div>
                  <h1 className='text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-3 flex items-center gap-4'>
                    <span className="text-5xl">🧑‍⚕️</span>
                    Patient Records
                  </h1>
                  <p className="text-gray-700 text-lg font-semibold">Manage and view comprehensive patient information</p>
                </div>
                
                {canManagePatients && (
                    <Link href="/dashboard/patients/create" className='group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 font-black text-lg hover:scale-105 relative overflow-hidden'>
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="relative z-10">Add New Patient</span>
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-8 animate-fade-in">
              <div className="relative max-w-2xl">
                <input
                  type="text"
                  placeholder="Search by name or record number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 shadow-lg transition-all bg-white/80 backdrop-blur-sm font-semibold text-gray-800 placeholder-gray-500"
                />
                <svg className="absolute left-5 top-4.5 w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-indigo-200 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{patients.length}</span>
                  </div>
                  <p className="text-base font-bold text-gray-800">Total Patients</p>
                  <p className="text-sm text-gray-600 font-medium">Registered in system</p>
                </div>
              </div>

              <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/50 hover:border-purple-200 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">{filteredPatients.length}</span>
                  </div>
                  <p className="text-base font-bold text-gray-800">Filtered Results</p>
                  <p className="text-sm text-gray-600 font-medium">Currently showing</p>
                </div>
              </div>
            </div>

            <div className="mt-8 animate-fade-in-up">
                {renderTableContent()}
            </div>
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
            @keyframes fade-in-up {
                0% {
                    opacity: 0;
                    transform: translateY(20px);
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
            .animate-fade-in-up {
                animation: fade-in-up 0.8s ease-out 0.3s both;
            }
            .animate-fade-in {
                animation: fade-in 0.6s ease-out 0.2s both;
            }
        `}</style>
    </div>
  );
}

export default PatientsPage;