/**
 * Patient Selector Modal
 * 
 * Sprint 3: Unified Command Centre
 * Modal para seleccionar o crear paciente cuando se requiere para una acción
 */

import React, { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { Patient } from '@/services/patientService';
import { usePatientsList } from '../hooks/usePatientsList';

export interface PatientSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
  onCreateNew: () => void;
}

export const PatientSelectorModal: React.FC<PatientSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onCreateNew,
}) => {
  const { patients, loading } = usePatientsList();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = (patient.fullName || `${patient.firstName} ${patient.lastName || ''}`).toLowerCase();
    const email = (patient.email || '').toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 font-apple">
            Select Patient
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-apple"
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 font-apple py-8">
              Loading patients...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center text-gray-500 font-apple py-8">
              {searchQuery ? 'No patients found matching your search' : 'No patients available'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className="w-full p-4 bg-white border border-gray-200 hover:border-primary-blue/50 hover:bg-primary-blue/5 rounded-xl transition-all duration-200 text-left"
                >
                  <div className="font-semibold text-gray-900 font-apple">
                    {patient.fullName || `${patient.firstName} ${patient.lastName || ''}`}
                  </div>
                  {patient.email && (
                    <div className="text-sm text-gray-600 font-apple font-light mt-1">
                      {patient.email}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-apple"
          >
            <UserPlus className="w-5 h-5" />
            Create New Patient
          </button>
        </div>
      </div>
    </div>
  );
};


