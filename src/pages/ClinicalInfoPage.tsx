// @ts-nocheck
import React, { useState } from 'react';

import logger from '@/shared/utils/logger';

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contact: string;
  emergencyContact: string;
  medicalHistory: string;
  currentMedications: string[];
  allergies: string[];
  warnings: string[];
  previousVisits: Visit[];
}

interface Visit {
  id: string;
  date: Date;
  diagnosis: string;
  treatment: string;
  notes: string;
}

export const ClinicalInfoPage: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientData>({
    id: 'P001',
    name: 'María González',
    age: 45,
    gender: 'female',
    contact: '+56 9 1234 5678',
    emergencyContact: '+56 9 8765 4321',
    medicalHistory: 'Hipertensión arterial, diabetes tipo 2, artritis reumatoide',
    currentMedications: [
      'Metformina 500mg 2x día',
      'Losartán 50mg 1x día',
      'Ibuprofeno 400mg según necesidad'
    ],
    allergies: ['Penicilina', 'Sulfamidas'],
    warnings: [
      'Paciente con riesgo cardiovascular alto',
      'Requiere monitoreo de glucemia diario',
      'Evitar ejercicios de alto impacto'
    ],
    previousVisits: [
      {
        id: 'V001',
        date: new Date('2024-01-15'),
        diagnosis: 'Dolor lumbar crónico',
        treatment: 'Fisioterapia, ejercicios de fortalecimiento',
        notes: 'Mejora significativa con tratamiento'
      },
      {
        id: 'V002',
        date: new Date('2024-02-20'),
        diagnosis: 'Tendinitis rotuliana',
        treatment: 'Reposo, hielo, antiinflamatorios',
        notes: 'Dolor persistente en rodilla derecha'
      }
    ]
  });

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border" style={{ borderColor: '#BDC3C7' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
              Información Clínica
            </h1>
            <p className="text-sm mt-1" style={{ color: '#BDC3C7' }}>
              Datos personales, historial médico y medicamentos
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: isEditing ? '#E74C3C' : '#5DA5A3',
              color: 'white'
            }}
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Datos Personales */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            Datos Personales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                Nombre Completo
              </label>
              <input
                id="name"
                type="text"
                value={patientData.name}
                onChange={(e) => setPatientData({...patientData, name: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
              />
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                Edad
              </label>
              <input
                id="age"
                type="number"
                value={patientData.age}
                onChange={(e) => setPatientData({...patientData, age: parseInt(e.target.value)})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                Teléfono
              </label>
              <input
                id="contact"
                type="tel"
                value={patientData.contact}
                onChange={(e) => setPatientData({...patientData, contact: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
              />
            </div>
            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                Contacto de Emergencia
              </label>
              <input
                id="emergencyContact"
                type="tel"
                value={patientData.emergencyContact}
                onChange={(e) => setPatientData({...patientData, emergencyContact: e.target.value})}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
              />
            </div>
          </div>
        </div>

        {/* Historial Médico */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            Historial Médico
          </h2>
          <textarea
            value={patientData.medicalHistory}
            onChange={(e) => setPatientData({...patientData, medicalHistory: e.target.value})}
            disabled={!isEditing}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
            placeholder="Describa el historial médico del paciente..."
          />
        </div>

        {/* Medicamentos Actuales */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            Medicamentos de Uso Regular
          </h2>
          <div className="space-y-2">
            {patientData.currentMedications.map((medication, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={medication}
                  onChange={(e) => {
                    const newMedications = [...patientData.currentMedications];
                    newMedications[index] = e.target.value;
                    setPatientData({...patientData, currentMedications: newMedications});
                  }}
                  disabled={!isEditing}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
                />
                {isEditing && (
                  <button
                    onClick={() => {
                      const newMedications = patientData.currentMedications.filter((_, i) => i !== index);
                      setPatientData({...patientData, currentMedications: newMedications});
                    }}
                    className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={() => {
                  setPatientData({
                    ...patientData,
                    currentMedications: [...patientData.currentMedications, '']
                  });
                }}
                className="px-4 py-2 text-sm border-2 border-dashed rounded-lg transition-colors"
                style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
              >
                + Agregar Medicamento
              </button>
            )}
          </div>
        </div>

        {/* Alergias */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            Alergias
          </h2>
          <div className="flex flex-wrap gap-2">
            {patientData.allergies.map((allergy, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
              >
                {allergy}
                {isEditing && (
                  <button
                    onClick={() => {
                      const newAllergies = patientData.allergies.filter((_, i) => i !== index);
                      setPatientData({...patientData, allergies: newAllergies});
                    }}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <button
                onClick={() => {
                  const newAllergy = prompt('Ingrese nueva alergia:');
                  if (newAllergy) {
                    setPatientData({
                      ...patientData,
                      allergies: [...patientData.allergies, newAllergy]
                    });
                  }
                }}
                className="px-3 py-1 border-2 border-dashed rounded-full text-sm transition-colors"
                style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
              >
                + Agregar Alergia
              </button>
            )}
          </div>
        </div>

        {/* Advertencias */}
        <div className="bg-yellow-50 rounded-lg p-4 border" style={{ borderColor: '#F59E0B' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            ⚠️ Advertencias Importantes
          </h2>
          <div className="space-y-2">
            {patientData.warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#F59E0B' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <span className="text-sm" style={{ color: '#2C3E50' }}>
                  {warning}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Visitas Previas */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            Visitas Previas
          </h2>
          <div className="space-y-3">
            {patientData.previousVisits.map((visit) => (
              <div key={visit.id} className="border rounded-lg p-3" style={{ borderColor: '#BDC3C7' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>
                    {visit.date.toLocaleDateString('es-CL')}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {visit.diagnosis}
                  </span>
                </div>
                <p className="text-sm mb-1" style={{ color: '#2C3E50' }}>
                  <strong>Tratamiento:</strong> {visit.treatment}
                </p>
                <p className="text-sm" style={{ color: '#BDC3C7' }}>
                  {visit.notes}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        {isEditing && (
          <div className="flex space-x-3 pt-4 border-t" style={{ borderColor: '#BDC3C7' }}>
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                // Aquí se guardaría en Firestore
                logger.info('Guardando datos del paciente:', patientData);
                setIsEditing(false);
              }}
              className="px-6 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalInfoPage; 