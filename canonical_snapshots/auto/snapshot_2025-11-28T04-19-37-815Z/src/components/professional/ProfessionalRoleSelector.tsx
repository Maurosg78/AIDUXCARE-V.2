// @ts-nocheck
import React, { useState, useEffect } from 'react';

export type ProfessionalRole = 'fisioterapeuta' | 'psicologo' | 'medico' | 'general';

export interface ProfessionalProfile {
  role: ProfessionalRole;
  name: string;
  specialties: string[];
  features: string[];
  color: string;
  icon: string;
}

interface ProfessionalRoleSelectorProps {
  onRoleChange: (role: ProfessionalRole) => void;
  selectedRole?: ProfessionalRole;
  className?: string;
}

const PROFESSIONAL_PROFILES: Record<ProfessionalRole, ProfessionalProfile> = {
  fisioterapeuta: {
    role: 'fisioterapeuta',
    name: 'Fisioterapeuta',
    specialties: ['Ortopedia', 'Deportiva', 'Neurológica', 'Respiratoria'],
    features: [
      'Análisis biomecánico',
      'Evaluación funcional',
      'Técnicas manuales',
      'Ejercicios terapéuticos',
      'Detección banderas rojas'
    ],
    color: '#5DA5A3',
    icon: '🦴'
  },
  psicologo: {
    role: 'psicologo',
    name: 'Psicólogo',
    specialties: ['Clínica', 'Cognitivo-conductual', 'Psicodinámica', 'Sistémica'],
    features: [
      'Evaluación psicológica',
      'Técnicas de intervención',
      'Manejo de crisis',
      'Seguimiento terapéutico',
      'Detección riesgo suicida'
    ],
    color: '#8E44AD',
    icon: '🧠'
  },
  medico: {
    role: 'medico',
    name: 'Médico',
    specialties: ['Medicina General', 'Especializada', 'Urgencias', 'Preventiva'],
    features: [
      'Evaluación médica',
      'Diagnóstico diferencial',
      'Prescripción médica',
      'Seguimiento clínico',
      'Detección patologías'
    ],
    color: '#E74C3C',
    icon: '⚕️'
  },
  general: {
    role: 'general',
    name: 'Profesional General',
    specialties: ['Multidisciplinar', 'Coordinación', 'Gestión'],
    features: [
      'Evaluación general',
      'Coordinación interdisciplinar',
      'Gestión de casos',
      'Seguimiento integral'
    ],
    color: '#95A5A6',
    icon: '👨‍⚕️'
  }
};

export const ProfessionalRoleSelector: React.FC<ProfessionalRoleSelectorProps> = ({
  onRoleChange,
  selectedRole = 'fisioterapeuta',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfessionalProfile>(
    PROFESSIONAL_PROFILES[selectedRole]
  );

  useEffect(() => {
    setSelectedProfile(PROFESSIONAL_PROFILES[selectedRole]);
  }, [selectedRole]);

  const handleRoleSelect = (role: ProfessionalRole) => {
    setSelectedProfile(PROFESSIONAL_PROFILES[role]);
    onRoleChange(role);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selector Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        style={{ borderColor: '#BDC3C7' }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: selectedProfile.color + '20' }}
          >
            {selectedProfile.icon}
          </div>
          <div className="text-left">
            <div className="font-medium text-sm" style={{ color: '#2C3E50' }}>
              {selectedProfile.name}
            </div>
            <div className="text-xs" style={{ color: '#BDC3C7' }}>
              {selectedProfile.specialties[0]}
            </div>
          </div>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: '#BDC3C7' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Dropdown de Opciones */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50" style={{ borderColor: '#BDC3C7' }}>
          <div className="p-2">
            {Object.values(PROFESSIONAL_PROFILES).map((profile) => (
              <button
                key={profile.role}
                onClick={() => handleRoleSelect(profile.role)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  selectedProfile.role === profile.role 
                    ? 'bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: profile.color + '20' }}
                >
                  {profile.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm" style={{ color: '#2C3E50' }}>
                    {profile.name}
                  </div>
                  <div className="text-xs" style={{ color: '#BDC3C7' }}>
                    {profile.specialties.slice(0, 2).join(', ')}
                  </div>
                </div>
                {selectedProfile.role === profile.role && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Panel de Características */}
      <div className="mt-4 p-4 bg-white border rounded-lg" style={{ borderColor: '#BDC3C7' }}>
        <h4 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>
          Características de {selectedProfile.name}
        </h4>
        
        {/* Especialidades */}
        <div className="mb-4">
          <h5 className="text-xs font-medium mb-2" style={{ color: '#BDC3C7' }}>
            ESPECIALIDADES
          </h5>
          <div className="flex flex-wrap gap-2">
            {selectedProfile.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-full"
                style={{ 
                  backgroundColor: selectedProfile.color + '20',
                  color: selectedProfile.color
                }}
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        {/* Funcionalidades */}
        <div>
          <h5 className="text-xs font-medium mb-2" style={{ color: '#BDC3C7' }}>
            FUNCIONALIDADES
          </h5>
          <ul className="space-y-1">
            {selectedProfile.features.map((feature, index) => (
              <li key={index} className="flex items-center space-x-2 text-xs" style={{ color: '#2C3E50' }}>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: selectedProfile.color }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRoleSelector; 