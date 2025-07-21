/**
 * 🏥 Welcome Page - Página de Bienvenida Inteligente
 * Detecta el estado del perfil profesional y guía al usuario según su situación
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthService } from '../core/auth/firebaseAuthService';
import { ProfessionalProfileService } from '../core/services/ProfessionalProfileService';
import { ProfessionalProfile } from '../core/domain/professionalType';

interface WelcomeState {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  profile?: ProfessionalProfile;
  error?: string;
}

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<WelcomeState>({
    isLoading: true,
    isAuthenticated: false,
    hasProfile: false
  });

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const authService = new FirebaseAuthService();
      const session = await authService.getCurrentSession();

      if (!session.user) {
        // Usuario no autenticado
        setState({
          isLoading: false,
          isAuthenticated: false,
          hasProfile: false
        });
        return;
      }

      // Usuario autenticado, verificar si tiene perfil
      const profile = await ProfessionalProfileService.getProfileByUserId(session.user.id);

      setState({
        isLoading: false,
        isAuthenticated: true,
        hasProfile: !!profile,
        profile: profile || undefined
      });

    } catch (error) {
      console.error('Error verificando estado del usuario:', error);
      setState({
        isLoading: false,
        isAuthenticated: false,
        hasProfile: false,
        error: 'Error al verificar el estado del usuario'
      });
    }
  };

  const handleCreateProfile = () => {
    navigate('/professional-onboarding');
  };

  const handleGoToDashboard = () => {
    navigate('/professional-workflow');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando tu perfil profesional...</p>
        </div>
      </div>
    );
  }

  // Usuario no autenticado
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏥 Bienvenido a AiDuxCare
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              La plataforma de IA especializada para profesionales de la salud
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Evaluación Inteligente</h3>
              <p className="text-gray-600">Tests clínicos especializados según tu área de expertise</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentación SOAP</h3>
              <p className="text-gray-600">Generación automática de documentos clínicos oficiales</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Médico</h3>
              <p className="text-gray-600">Cumple estándares HIPAA/GDPR para uso clínico seguro</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={handleLogin}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </button>
            <p className="text-gray-500 mt-4">
              ¿No tienes cuenta? <span className="text-blue-600 cursor-pointer">Regístrate aquí</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado sin perfil
  if (!state.hasProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎯 ¡Un paso más para personalizar tu experiencia!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Necesitamos conocer tu perfil profesional para ofrecerte la mejor experiencia
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              ¿Por qué es importante tu perfil?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Tests Especializados</h3>
                  <p className="text-gray-600">Cargamos automáticamente los tests clínicos específicos de tu especialización</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-green-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Firma Profesional</h3>
                  <p className="text-gray-600">Tus documentos oficiales incluirán tu especialización destacada</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-purple-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Experiencia Personalizada</h3>
                  <p className="text-gray-600">La interfaz se adapta a tu población de pacientes y áreas de interés</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-1">
                  <span className="text-orange-600 font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Certificaciones Técnicas</h3>
                  <p className="text-gray-600">Incluye tus técnicas especializadas (K-Tape, Dry Needling, EPI, etc.)</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={handleCreateProfile}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Crear Mi Perfil Profesional
            </button>
            <p className="text-gray-500 mt-4">
              Solo toma 5 minutos y es completamente gratuito
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado con perfil
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏥 ¡Bienvenido de vuelta a AiDuxCare!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            ¿Qué te gustaría hacer hoy?
          </p>
        </div>

        {/* Opciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Opción 1: Ingresar al Portal */}
          <button 
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer w-full text-left"
            onClick={handleGoToDashboard}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleGoToDashboard();
              }
            }}
            aria-label="Ingresar al portal principal"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Ingresar al Portal</h3>
            <p className="text-gray-600 text-center mb-4">
              Accede a tu dashboard principal y comienza a trabajar con tus pacientes
            </p>
            <div className="text-center">
              <span className="inline-flex items-center text-blue-600 font-medium">
                Continuar
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </button>

          {/* Opción 2: Actualizar Mi Perfil */}
          <button 
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer w-full text-left"
            onClick={() => navigate('/professional-onboarding')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/professional-onboarding');
              }
            }}
            aria-label="Actualizar mi perfil profesional"
          >
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Actualizar Mi Perfil</h3>
            <p className="text-gray-600 text-center mb-4">
              Modifica tu información profesional, especialidades o certificaciones
            </p>
            <div className="text-center">
              <span className="inline-flex items-center text-green-600 font-medium">
                Editar
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
            </div>
          </button>

          {/* Opción 3: Crear Mi Perfil (Primera Vez) */}
          <button 
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer w-full text-left"
            onClick={handleCreateProfile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleCreateProfile();
              }
            }}
            aria-label="Crear mi perfil profesional por primera vez"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Crear Mi Perfil</h3>
            <p className="text-gray-600 text-center mb-4">
              Configura tu perfil profesional por primera vez
            </p>
            <div className="text-center">
              <span className="inline-flex items-center text-orange-600 font-medium">
                Comenzar
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </button>
        </div>

        {/* Información del perfil actual */}
        {state.profile && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu Perfil Actual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Profesión</p>
                <p className="font-medium">No disponible</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Especialidad</p>
                <p className="font-medium">No especificada</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Años de Experiencia</p>
                <p className="font-medium">0 años</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última Actualización</p>
                <p className="font-medium">No disponible</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomePage; 