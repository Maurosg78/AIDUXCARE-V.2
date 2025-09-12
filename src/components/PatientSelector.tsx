import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface PatientSelectorProps {
  patients: any[];
  selectedPatient: any;
  onSelectPatient: (patient: any) => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  patients,
  selectedPatient,
  onSelectPatient
}) => {
  const { language } = useLanguage();
  const t = getTranslation(language).workflow.patient;
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">{t.select}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {patients.map(patient => (
          <button
            key={patient.id}
            onClick={() => onSelectPatient(patient)}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedPatient?.id === patient.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">{patient.name}</div>
            <div className="text-sm text-gray-600">
              {t.recordNumber}: {patient.recordNumber}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
