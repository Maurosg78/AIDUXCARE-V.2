/**
 * NOTES Patient Data Page - IDENTIDAD VISUAL OFICIAL AIDUXCARE
 * Página para capturar datos básicos del paciente con diseño oficial
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { localStorageService } from "@/services/LocalStorageService";
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

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
  const { currentTherapist, logout } = useAuth();

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Preparar datos del paciente
    const patientForStorage = {
      name: patientData.nombre,
      age: parseInt(patientData.edad) || 0,
      phone: patientData.telefono,
      email: patientData.email,
      condition: patientData.motivoConsulta,
      allergies: patientData.alergias ? patientData.alergias.split(',').map(a => a.trim()) : [],
      medications: patientData.medicamentos ? patientData.medicamentos.split(',').map(m => m.trim()) : [],
      clinicalHistory: patientData.antecedentes,
      derivadoPor: patientData.derivadoPor
    };

    try {
      // 1. Guardar paciente en la lista permanente usando LocalStorageService
      const savedPatient = localStorageService.savePatient(patientForStorage);
      
      if (!savedPatient) {
        throw new Error('No se pudo guardar el paciente');
      }

      console.log('SUCCESS: Paciente guardado en lista permanente:', savedPatient);

      // 2. También guardar temporalmente para PatientCompletePage
      localStorage.setItem('aiduxcare_current_patient', JSON.stringify(savedPatient));
    
      // Mostrar mensaje de éxito
      setShowSuccess(true);
      
      // 3. Navegar a la página de completar datos después de mostrar éxito
      setTimeout(() => {
        navigate("/patient-complete");
      }, 1500);

    } catch (error) {
      console.error('ERROR: Error al guardar paciente:', error);
      setIsSubmitting(false);
      alert('Error al guardar el paciente. Por favor, inténtalo de nuevo.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const canSubmit = patientData.nombre.trim() && patientData.email.trim() && patientData.motivoConsulta.trim();
  const totalPatients = localStorageService.getAllPatients().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header con identidad oficial */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <AiDuxCareLogo size="sm" />
              <div>
                <h1 className="text-xl font-bold text-[#2C3E50]">AiDuxCare</h1>
                <p className="text-sm text-[#2C3E50]/70">EMR Inteligente</p>
              </div>
            </div>

            {/* Info del terapeuta y acciones */}
            <div className="flex items-center space-x-4">
              {currentTherapist && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[#2C3E50]">{currentTherapist.name}</p>
                  <p className="text-xs text-[#2C3E50]/60">Profesional de la salud</p>
                </div>
              )}
              <button
                onClick={() => navigate('/patients')}
                className="text-[#5DA5A3] hover:text-[#4A8280] transition-colors"
                title="Volver a lista de pacientes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="text-[#5DA5A3] hover:text-[#4A8280] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mensaje de éxito */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#A8E6CF] border border-[#5DA5A3] text-[#2C3E50] px-6 py-3 rounded-xl shadow-lg animate-bounce">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">¡Paciente guardado exitosamente!</span>
            <span className="text-sm opacity-70">Total: {totalPatients + 1} pacientes</span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de sección */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#2C3E50]">USER: Nuevo Paciente</h2>
              <p className="text-[#2C3E50]/70">Información básica para iniciar la atención</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos básicos */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#BDC3C7]/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-[#A8E6CF]/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50]">Datos del Paciente</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Nombre Completo <span className="text-[#FF6F61]">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={patientData.nombre}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Ej: Andrea González"
                  required
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Email <span className="text-[#FF6F61]">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={patientData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="andrea.gonzalez@email.com"
                  required
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={patientData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Ej: +56 9 8765 4321"
                />
              </div>

              {/* Edad */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">Edad</label>
                <input
                  type="number"
                  name="edad"
                  value={patientData.edad}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Años"
                  min="0"
                  max="120"
                />
              </div>
            </div>
          </div>

          {/* Información clínica */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#BDC3C7]/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-[#A8E6CF]/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50]">Información Clínica</h3>
            </div>

            <div className="space-y-6">
              {/* Motivo de Consulta */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Motivo de Consulta <span className="text-[#FF6F61]">*</span>
                </label>
                <textarea
                  name="motivoConsulta"
                  value={patientData.motivoConsulta}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all resize-none"
                  placeholder="Describe el motivo principal de la consulta..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Alergias */}
                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-2">Alergias</label>
                  <input
                    type="text"
                    name="alergias"
                    value={patientData.alergias}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                    placeholder="Separar con comas"
                  />
                </div>

                {/* Medicamentos */}
                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-2">Medicamentos</label>
                  <input
                    type="text"
                    name="medicamentos"
                    value={patientData.medicamentos}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                    placeholder="Separar con comas"
                  />
                </div>
              </div>

              {/* Antecedentes Clínicos */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">Antecedentes Clínicos</label>
                <textarea
                  name="antecedentes"
                  value={patientData.antecedentes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all resize-none"
                  placeholder="Historial médico relevante..."
                  rows={3}
                />
              </div>

              {/* Derivado Por */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">Derivado Por</label>
                <input
                  type="text"
                  name="derivadoPor"
                  value={patientData.derivadoPor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-[#BDC3C7]/30 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Médico o institución que deriva"
                />
              </div>
            </div>
          </div>

          {/* Sistema en Vivo */}
          <div className="bg-gradient-to-r from-[#A8E6CF]/20 to-[#5DA5A3]/10 rounded-2xl p-6 border border-[#5DA5A3]/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-[#5DA5A3] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#2C3E50]">Sistema en Vivo</h3>
            </div>
            <p className="text-[#2C3E50]/70 mb-4">
              Los datos se guardarán en la base de datos y estarán disponibles para futuras consultas.
            </p>
            <div className="flex items-center space-x-2 text-sm text-[#2C3E50]/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Datos guardados localmente</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-6 py-3 bg-white border border-[#BDC3C7]/30 text-[#2C3E50] rounded-xl hover:bg-[#F7F7F7] transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Ver Lista de Pacientes</span>
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="px-6 py-3 bg-[#BDC3C7]/20 text-[#2C3E50] rounded-xl hover:bg-[#BDC3C7]/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Guardar Paciente</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-center">
            <p className="text-sm text-[#2C3E50]/60">
              STATS: Pacientes registrados: <span className="font-semibold">{totalPatients}</span>
            </p>
            <p className="text-xs text-[#2C3E50]/50 mt-1">
              💾 Datos guardados localmente
            </p>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PatientDataPage;
