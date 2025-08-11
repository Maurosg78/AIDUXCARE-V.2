import React from 'react';
import { Patient } from '../hooks/usePatientSearch';

interface PatientSummaryCardProps {
  patient: Patient;
  onStartConsultation: (patientId: string) => void;
}

export const PatientSummaryCard: React.FC<PatientSummaryCardProps> = ({ 
  patient, 
  onStartConsultation 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-purple-300 transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900 text-lg">{patient.fullName}</h3>
          {patient.email && (
            <p className="text-sm text-gray-600">{patient.email}</p>
          )}
          {patient.phone && (
            <p className="text-sm text-gray-600">{patient.phone}</p>
          )}
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
          {patient.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {patient.dateOfBirth && (
          <p className="text-xs text-gray-500">
            Fecha de nacimiento: {formatDate(patient.dateOfBirth)}
          </p>
        )}
        
        {patient.lastVisit && (
          <p className="text-xs text-gray-500">
            Última visita: {formatDate(patient.lastVisit)}
          </p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          ID: {patient.id.slice(0, 8)}...
        </div>
        
        <button
          onClick={() => onStartConsultation(patient.id)}
          className="px-4 py-2 bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white text-sm rounded-lg hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-200 font-medium"
        >
          Iniciar Atención
        </button>
      </div>
    </div>
  );
};
