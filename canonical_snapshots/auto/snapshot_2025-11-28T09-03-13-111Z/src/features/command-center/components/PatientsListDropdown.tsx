import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, User } from 'lucide-react';
import { usePatientsList } from '../hooks/usePatientsList';

interface PatientsListDropdownProps {
  onPatientSelect?: (patientId: string) => void;
  className?: string;
}

/**
 * Componente de lista desplegable de pacientes ordenados alfabéticamente por apellido
 */
export const PatientsListDropdown: React.FC<PatientsListDropdownProps> = ({
  onPatientSelect,
  className = '',
}) => {
  const navigate = useNavigate();
  const { patients, loading, error } = usePatientsList();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar pacientes por término de búsqueda
  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.fullName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchTerm)
    );
  });

  const handlePatientClick = (patientId: string) => {
    setIsOpen(false);
    setSearchTerm('');
    
    if (onPatientSelect) {
      onPatientSelect(patientId);
    } else {
      // Navegar al workflow con el paciente seleccionado
      navigate(`/workflow?patientId=${patientId}`);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de apertura */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all font-apple text-[15px]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary-blue" />
          <span className="text-gray-700 font-medium">
            {loading ? 'Loading patients...' : error ? 'Error loading patients' : `Select Patient (${patients.length})`}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-apple text-[15px]"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de pacientes */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-4 text-center text-gray-500 font-apple text-[15px]">
                Loading patients...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500 font-apple text-[15px]">
                Error loading patients: {error.message}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-apple text-[15px]">
                {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
              </div>
            ) : (
              <ul className="py-1" role="listbox">
                {filteredPatients.map((patient) => (
                  <li
                    key={patient.id}
                    role="option"
                    onClick={() => handlePatientClick(patient.id)}
                    className="px-4 py-3 hover:bg-primary-light cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 font-apple text-[15px]">
                          {patient.lastName && patient.firstName
                            ? `${patient.lastName}, ${patient.firstName}`
                            : patient.fullName}
                        </div>
                        {patient.email && (
                          <div className="text-sm text-gray-500 mt-1 font-apple">
                            {patient.email}
                          </div>
                        )}
                        {patient.phone && (
                          <div className="text-sm text-gray-500 font-apple">
                            {patient.phone}
                          </div>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 transform -rotate-90" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer con contador */}
          {!loading && !error && filteredPatients.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 font-apple text-center">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

