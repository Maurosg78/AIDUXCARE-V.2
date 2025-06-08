/**
 * 📝 Patient Data Page - AiDuxCare V.2
 * Página para capturar datos básicos del paciente
 * Diseño minimalista estilo Apple
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { localStorageService } from "@/services/LocalStorageService";
import TherapistHeader from "@/components/TherapistHeader";

interface PatientBasicData {
  nombre: string;
  edad: string;
  telefono: string;
  email: string;
  motivoConsulta: string;
  derivadoPor: string;
  alergias: string;
  medicamentos: string;
  antecedentes: string;
}

export const PatientDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTherapist } = useAuth();

  const [patientData, setPatientData] = useState<PatientBasicData>({
    nombre: "",
    edad: "",
    telefono: "",
    email: "",
    motivoConsulta: "",
    derivadoPor: "",
    alergias: "",
    medicamentos: "",
    antecedentes: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Guardar datos del paciente en LocalStorage para transferir a PatientCompletePage
    const patientForStorage = {
      id: `patient_${Date.now()}`,
      name: patientData.nombre,
      age: parseInt(patientData.edad) || 0,
      phone: patientData.telefono,
      email: patientData.email,
      condition: patientData.motivoConsulta,
      allergies: patientData.alergias ? patientData.alergias.split(',').map(a => a.trim()) : [],
      medications: patientData.medicamentos ? patientData.medicamentos.split(',').map(m => m.trim()) : [],
      clinicalHistory: patientData.antecedentes,
      derivadoPor: patientData.derivadoPor,
      createdAt: new Date().toISOString()
    };

    // Guardar en LocalStorage con clave temporal
    localStorage.setItem('aiduxcare_current_patient', JSON.stringify(patientForStorage));
    
    setTimeout(() => {
      navigate("/patient-complete");
    }, 1000);
  };

  const canProceedStep1 = patientData.nombre.trim() && patientData.edad.trim();
  const canProceedStep2 = patientData.motivoConsulta.trim();
  const canSubmit = canProceedStep1 && canProceedStep2;

  return (
    <div className="min-h-screen bg-gray-50">
      <TherapistHeader />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light mb-2" style={{ color: '#2C3E50' }}>
            Nuevo Paciente
          </h1>
          <p className="text-gray-600">
            Información básica para iniciar la atención
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-6">
            <h2 className="text-xl font-medium mb-6" style={{ color: '#2C3E50' }}>
              Datos del Paciente
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={patientData.nombre}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg transition-colors"
                  style={{
                    outline: 'none',
                    borderColor: '#E5E7EB'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5DA5A3';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 165, 163, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Nombre y apellidos"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad *
                </label>
                <input
                  type="number"
                  name="edad"
                  value={patientData.edad}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Años"
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Consulta *
                </label>
                <textarea
                  name="motivoConsulta"
                  value={patientData.motivoConsulta}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="¿Qué te trae hoy?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={patientData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={patientData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Iniciar Atención</span>
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Los datos se guardan localmente de forma segura
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDataPage;
