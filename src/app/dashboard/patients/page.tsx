// src/app/dashboard/patients/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { config } from '@/lib/config';
import StatsCard from '@/app/components/StatsCard';
import PageHeader from '@/app/components/PageHeader';
import ClientDate from '@/app/components/ClientDate';

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
      const response = await fetch(`${config.apiBaseUrl}/api/patients`);
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
      const response = await fetch(`${config.apiBaseUrl}/api/patients/${recordNumber}`, {
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

  const canManagePatients = userRole === Role.reception || userRole === Role.admin;

  const renderTableContent = (): React.JSX.Element => {
    if (isLoading || status === "loading") {
      return (
        <div className="text-center py-16">
          <div className="inline-block relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 mt-4 font-medium">Loading patient records...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700 font-semibold text-lg">{error}</p>
        </div>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="bg-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-slate-700 text-xl font-bold mb-2">
            {searchTerm ? 'No patients found matching your search' : 'No patient records found'}
          </p>
          {canManagePatients && !searchTerm && (
            <p className="text-slate-500 text-lg">Click &quot;Add New Patient&quot; to get started</p>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Record No.</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Birth</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Allergies</th>
                {canManagePatients && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredPatients.map((patient, index) => {
                const fullName = `${patient.firstName} ${patient.lastName}`;
                return (
                  <tr
                    key={patient.recordNumber}
                    onClick={() => handleRowClick(patient.recordNumber)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-bold text-emerald-600 group-hover:text-emerald-700">
                        {patient.recordNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                          <span className="text-sm">{patient.firstName?.[0] || ''}{patient.lastName?.[0] || ''}</span>
                        </div>
                        <div className="ml-4">
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{fullName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${patient.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                          patient.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                            'bg-slate-100 text-slate-800'}`}>
                        {patient.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      <ClientDate date={patient.dateOfBirth} options={{ year: 'numeric', month: 'short', day: 'numeric' }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                      <div className="truncate font-medium">
                        {patient.allergies || <span className="text-slate-400 italic">None</span>}
                      </div>
                    </td>

                    {canManagePatients && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => handleDelete(e, patient.recordNumber, fullName)}
                          className="text-red-600 hover:text-red-900 font-semibold hover:underline px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
    <>
      <PageHeader
        title="Patient Records"
        subtitle="Manage and view comprehensive patient information"
        icon="🧑‍⚕️"
        actionButton={canManagePatients ? { label: "Add New Patient", href: "/dashboard/patients/create" } : undefined}
      />

      {/* Search Bar */}
      <div className="mb-8 animate-fade-in">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search by name or record number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all bg-white text-slate-900 placeholder-slate-400"
          />
          <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Patients"
          value={patients.length}
          subtitle="Registered in system"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          iconBgFrom="from-indigo-500"
          iconBgTo="to-indigo-600"
          textColor="text-indigo-600"
        />

        <StatsCard
          title="Filtered Results"
          value={filteredPatients.length}
          subtitle="Currently showing"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          iconBgFrom="from-purple-500"
          iconBgTo="to-purple-600"
          textColor="text-purple-600"
        />
      </div>

      <div className="mt-6 animate-fade-in-up">
        {renderTableContent()}
      </div>
    </>
  );
}

export default PatientsPage;