// src/app/dashboard/patients/page.tsx
"use client";

// (TS) 1. Import React และ Type ที่จำเป็น
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client'; // (TS) 2. Import Role enum

// (TS) 3. สร้าง Interface สำหรับข้อมูล Patient ที่รับมาจาก API
// (อ้างอิงจาก API /api/patients/route.ts ที่เราทำไป)
interface PatientData {
  id: number;
  recordNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // API ส่งมาเป็น ISO String
  allergies: string | null;
  medicalHistory: string | null;
  currentMedications: string | null;
}

function PatientsPage() {
  // (TS) 4. กำหนด Type ให้กับ State
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const router = useRouter(); 

  // (TS) 5. กำหนด Type return ให้ useCallback เป็น Promise<void>
  const fetchPatients = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/patients");
      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.statusText}`);
      }
      // (TS) 6. กำหนด Type ให้ data ที่รับมา
      const data: PatientData[] = await response.json();
      setPatients(data);
      setFilteredPatients(data);
    } catch (err: any) { // (TS) 7. กำหนด Type error
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

  // Search filter
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPatients(patients);
    } else {
      // (TS) 8. Type ของ 'patient' จะเป็น PatientData โดยอัตโนมัติ
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const recordNumber = patient.recordNumber.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || recordNumber.includes(search);
      });
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // (TS) 9. กำหนด Type parameter 'recordNumber'
  const handleRowClick = useCallback((recordNumber: string) => {
    router.push(`/dashboard/patients/${recordNumber}`);
  }, [router]);

  // (TS) 10. กำหนด Type ให้ Event และ parameters
  const handleDelete = useCallback(async (
    event: React.MouseEvent<HTMLButtonElement>, 
    recordNumber: string, 
    patientName: string
  ) => {
    event.stopPropagation(); // (TS) 11. event มี Type ที่ถูกต้อง

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

    } catch (err: any) { // (TS) 12. กำหนด Type error
      console.error("Deletion error:", err);
      alert(`Error deleting patient: ${err.message}`);
    }

  }, [fetchPatients]); // (TS) 13. fetchPatients ถูกส่งเข้ามาใน dependency array

  // (TS) 14. กำหนด Type parameter
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // (TS) 15. ใช้ Role enum ในการเปรียบเทียบ
  const canManagePatients = userRole === Role.reception || userRole === Role.admin;

  // (TS) 16. กำหนด Type return เป็น React.JSX.Element
  const renderTableContent = (): React.JSX.Element => {
    if (isLoading || status === "loading") {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading patient records...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm ? 'No patients found matching your search' : 'No patient records found'}
          </p>
          {canManagePatients && !searchTerm && (
            <p className="text-gray-500">Click "Add New Patient" to start</p>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-hidden bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Record No.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date of Birth</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Allergies</th>
                {canManagePatients && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {/* (TS) 17. 'patient' มี Type เป็น PatientData ที่ถูกต้อง */}
              {filteredPatients.map((patient, index) => {
                  const fullName = `${patient.firstName} ${patient.lastName}`;
                  return (
                      <tr 
                          key={patient.recordNumber}
                          onClick={() => handleRowClick(patient.recordNumber)}
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition duration-200 group" 
                      >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-semibold text-blue-600 group-hover:text-blue-700">{patient.recordNumber}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                {/* (TS) 18. เพิ่มการเช็ค firstName[0] และ lastName[0] เผื่อเป็นค่าว่าง */}
                                <span className="text-blue-700 font-semibold text-sm">{patient.firstName?.[0] || ''}{patient.lastName?.[0] || ''}</span>
                              </div>
                              <div className="ml-3">
                                <span className="text-sm font-semibold text-gray-900">{fullName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${patient.gender === 'male' ? 'bg-blue-100 text-blue-800' : 
                                patient.gender === 'female' ? 'bg-pink-100 text-pink-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {patient.gender}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(patient.dateOfBirth)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                            <div className="truncate">
                              {patient.allergies || <span className="text-gray-400 italic">None</span>}
                            </div>
                          </td>
                          
                          {canManagePatients && (
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                      onClick={(e) => handleDelete(e, patient.recordNumber, fullName)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg font-semibold transition duration-150"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <Link href="/dashboard" className='inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors group'>
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
            </Link>
            
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8'>
                <div>
                  <h1 className='text-4xl font-bold text-gray-900 flex items-center gap-3'>
                    <span className="text-4xl">🧑</span>
                    Patient Records
                  </h1>
                  <p className="text-gray-600 mt-2">Manage and view all patient information</p>
                </div>
                
                {canManagePatients && (
                    <Link href="/dashboard/patients/create" className='inline-flex items-center bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold group'>
                        <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Patient
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search by name or record number..."
                  value={searchTerm}
                  // (TS) 19. Type ของ e ถูกอนุมาน (inferred) เป็น React.ChangeEvent<HTMLInputElement>
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                />
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:max-w-xs gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
            </div>

            <div className="mt-8">
                {renderTableContent()}
            </div>
        </div>
    </div>
  );
}

export default PatientsPage;