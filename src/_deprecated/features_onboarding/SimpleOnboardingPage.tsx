/**
 * 🏥 Simple Onboarding Page - Wizard funcional sin dependencias problemáticas
 */

import React, { useState } from 'react';

export const SimpleOnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profession: '',
    country: ''
  });

  const steps = [
    { id: 'personal', title: 'Datos Personales', description: 'Información básica' },
    { id: 'professional', title: 'Datos Profesionales', description: 'Profesión y especialidad' },
    { id: 'compliance', title: 'Compliance', description: 'Consentimientos y seguridad' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!(formData.firstName && formData.lastName && formData.email);
      case 1:
        return !!(formData.profession && formData.country);
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    console.log('Datos del formulario:', formData);
    alert('¡Onboarding completado! Datos: ' + JSON.stringify(formData, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header con gradiente fucsia-azul */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#E91E63] to-[#3B82F6] bg-clip-text text-transparent mb-4">
            Registro Profesional AiDuxCare
          </h1>
          <p className="text-lg text-gray-600">
            Completa tu perfil en solo 3 pasos
          </p>
        </div>

        {/* Indicadores de progreso */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                index <= currentStep 
                  ? 'bg-gradient-to-r from-[#E91E63] to-[#3B82F6] shadow-lg' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <div className="ml-3">
                <h3 className={`font-semibold ${
                  index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-sm ${
                  index <= currentStep ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-1 mx-4 transition-all duration-300 ${
                  index < currentStep 
                    ? 'bg-gradient-to-r from-[#E91E63] to-[#3B82F6]' 
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Contenido del paso actual */}
        <div className="mb-8">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primer Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primer Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Datos Profesionales</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesión *
                </label>
                <select
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="">Selecciona tu profesión</option>
                  <option value="Fisioterapia">Fisioterapia</option>
                  <option value="Medicina">Medicina</option>
                  <option value="Enfermería">Enfermería</option>
                  <option value="Psicología">Psicología</option>
                  <option value="Odontología">Odontología</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="">Selecciona tu país</option>
                  <option value="España">España</option>
                  <option value="México">México</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Chile">Chile</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Compliance y Seguridad</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Al completar este formulario, aceptas nuestros términos de servicio y política de privacidad.
                  Tus datos serán tratados con la máxima seguridad y confidencialidad.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input type="checkbox" id="gdpr" className="w-4 h-4 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6]" />
                  <label htmlFor="gdpr" className="ml-2 text-sm text-gray-700">
                    Acepto el tratamiento de datos personales (GDPR)
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="terms" className="w-4 h-4 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6]" />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                    Acepto los términos y condiciones
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-[#E91E63] to-[#3B82F6] text-white font-semibold rounded-lg hover:from-[#D81B60] hover:to-[#2563EB] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Completar Registro
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="px-6 py-3 bg-gradient-to-r from-[#E91E63] to-[#3B82F6] text-white font-semibold rounded-lg hover:from-[#D81B60] hover:to-[#2563EB] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboardingPage;
