// @ts-nocheck
 import React, { useState, useEffect } from 'react';

import { appointmentService } from '../../../services/appointmentService';
import PatientService from '../../../services/patientService';
import { Patient } from '../hooks/usePatientSearch';

import logger from '@/shared/utils/logger';

interface AppointmentFormProps {
  onClose: () => void;
  onAppointmentCreated: () => void;
  selectedPatient?: string | null;
  selectedDate?: Date;
}

interface AppointmentFormData {
  patientId: string;
  dateTime: string;
  duration: number;
  notes: string;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  onClose, 
  onAppointmentCreated, 
  selectedPatient, 
  selectedDate 
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: selectedPatient || '',
    dateTime: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
    duration: 30,
    notes: ''
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar pacientes al abrir el formulario
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const allPatients = await PatientService.getAllPatients();
        setPatients(allPatients);
      } catch (err) {
        logger.error('Error cargando pacientes:', err);
      }
    };
    loadPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await appointmentService.createAppointment(formData);
      onAppointmentCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cita');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AppointmentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-light text-gray-900 tracking-tight">
              Nueva{' '}
              <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent font-medium">
                Cita
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                Paciente *
              </label>
              <select
                id="patientId"
                required
                value={formData.patientId}
                onChange={(e) => handleChange('patientId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              >
                <option value="">Seleccionar paciente</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y hora *
              </label>
              <input
                id="dateTime"
                type="datetime-local"
                required
                value={formData.dateTime}
                onChange={(e) => handleChange('dateTime', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duración (minutos) *
              </label>
              <select
                id="duration"
                required
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
                <option value={120}>2 horas</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="Observaciones sobre la cita..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : 'Crear Cita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};