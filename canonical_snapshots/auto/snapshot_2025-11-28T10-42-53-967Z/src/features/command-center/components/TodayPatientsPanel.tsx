/**
 * Today's Patients Panel
 * 
 * Sprint 3: Unified Command Centre
 * Bloque 1: Lista compacta de pacientes + botón crear nuevo paciente
 */

import React, { useState, useEffect } from 'react';
import { Patient } from '@/services/patientService';
import { usePatientsList } from '../hooks/usePatientsList';

export interface TodayAppointment {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  sessionType?: string;
  chips?: {
    type: 'wsib' | 'consent-required' | 'pending-note';
    label: string;
  }[];
}

export interface TodayPatientsPanelProps {
  appointments: TodayAppointment[];
  loading: boolean;
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
}

export const TodayPatientsPanel: React.FC<TodayPatientsPanelProps> = ({
  appointments,
  loading,
  selectedPatient,
  onSelectPatient,
}) => {
  const { patients: allPatients, loading: patientsLoading } = usePatientsList();
  const [isListExpanded, setIsListExpanded] = useState(appointments.length > 0);

  // Auto-expand if there are appointments today
  React.useEffect(() => {
    setIsListExpanded(appointments.length > 0);
  }, [appointments.length]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
          Today's Patients
        </h2>
        <p className="text-base text-gray-600 font-apple font-light">
          {appointments.length > 0 
            ? `${appointments.length} appointment${appointments.length > 1 ? 's' : ''} today`
            : 'No appointments scheduled'}
        </p>
      </div>

      {/* Show today's appointments if any */}
      {appointments.length > 0 && isListExpanded && (
        <div className="mt-4 space-y-2">
          {appointments.map((apt) => {
            const patient = allPatients.find(p => p.id === apt.patientId);
            if (!patient) return null;
            
            return (
              <button
                key={apt.id}
                onClick={() => {
                  const fullPatient: Patient = {
                    id: patient.id,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    fullName: patient.fullName,
                    email: patient.email || '',
                    phone: patient.phone || '',
                  } as Patient;
                  onSelectPatient(fullPatient);
                }}
                className={`w-full p-3 rounded-lg border transition-all duration-200 text-left hover:shadow-sm ${
                  selectedPatient?.id === apt.patientId
                    ? 'border-primary-blue bg-primary-blue/5'
                    : 'border-gray-200 bg-white hover:border-primary-blue/30 hover:bg-primary-blue/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 font-apple text-sm">
                      {apt.patientName}
                    </div>
                    <div className="text-xs text-gray-600 font-apple font-light mt-0.5">
                      {apt.time} • {apt.sessionType || 'Session'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

