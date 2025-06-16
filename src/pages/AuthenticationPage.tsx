/**
 * 🔐 Authentication Page - AiDuxCare V.2
 * Página de autenticación con identidad visual oficial
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterData } from '@/services/LocalAuthService';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

type AuthMode = 'select' | 'login' | 'register';

const AuthenticationPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isLoading, 
    login, 
    register, 
    switchTherapist, 
    getAllTherapists 
  } = useAuth();

  // Usar ref para evitar problemas con StrictMode
  const hasRedirected = useRef(false);
  const isMounted = useRef(true);

  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    licenseNumber: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTherapists, setAvailableTherapists] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Inicialización
  useEffect(() => {
    if (!isMounted.current) return;
    
    setIsVisible(true);
    const therapists = getAllTherapists();
    setAvailableTherapists(therapists);
    
    // Si hay terapeutas disponibles, mostrar la selección
    // Si no hay terapeutas, permitir tanto login como registro
    if (therapists.length > 0) {
      setAuthMode('select');
    } else {
      setAuthMode('login'); // Cambiar a login por defecto en lugar de register
    }
  }, [getAllTherapists]);

  // Manejar redirección cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasRedirected.current && isMounted.current) {
      hasRedirected.current = true;
      console.log('🔄 Redirigiendo a /patients...');
      navigate('/patients', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMounted.current) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleModeChange = useCallback((mode: AuthMode) => {
    if (!isMounted.current) return;
    setAuthMode(mode);
    setErrors([]);
    setFormData({ name: '', email: '', specialization: '', licenseNumber: '' });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current || isSubmitting) return;
    
    if (!formData.name.trim()) {
      setErrors(['Por favor ingresa tu nombre de perfil.']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      const result = await login(formData.name.trim());
      if (!isMounted.current) return;
      
      if (!result.success) {
        setErrors([result.error || 'Nombre de perfil no encontrado.']);
      }
    } catch (error) {
      if (!isMounted.current) return;
      setErrors(['Error interno. Por favor intenta nuevamente.']);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current || isSubmitting) return;
    
    if (!formData.name.trim() || !formData.specialization.trim()) {
      setErrors(['Nombre y Especialización son campos obligatorios.']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      const registerData: RegisterData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        specialization: formData.specialization.trim(),
        licenseNumber: formData.licenseNumber.trim() || undefined
      };
      
      const result = await register(registerData);
      if (!isMounted.current) return;
      
      if (!result.success) {
        setErrors([result.error || 'Este nombre de perfil ya existe.']);
      }
    } catch (error) {
      if (!isMounted.current) return;
      setErrors(['Error interno. Por favor intenta nuevamente.']);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleTherapistSelect = async (therapistName: string) => {
    if (!isMounted.current || isSubmitting) return;
    
    // Solicitar PIN de seguridad antes de acceder
    const pin = prompt(`🔐 Ingresa tu PIN de seguridad para acceder como ${therapistName}:`);
    
    if (!pin) {
      setErrors(['PIN requerido para acceder al perfil.']);
      return;
    }
    
    // Validar PIN (en producción sería más seguro)
    if (pin !== '1234' && pin !== therapistName.toLowerCase()) {
      setErrors(['PIN incorrecto. Acceso denegado.']);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      const result = await switchTherapist(therapistName);
      if (!isMounted.current) return;
      
      if (!result.success) {
        setErrors([result.error || 'Error al seleccionar el perfil del terapeuta.']);
      }
    } catch (error) {
      if (!isMounted.current) return;
      setErrors(['Error interno. Por favor intenta nuevamente.']);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Si está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#2C3E50] text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, mostrar mensaje de redirección
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#2C3E50] text-lg">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center p-4 overflow-hidden">
      {/* Elementos decorativos de fondo con colores oficiales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 lg:w-80 lg:h-80 bg-[#5DA5A3]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 lg:w-80 lg:h-80 bg-[#FF6F61]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className={`w-full max-w-md relative z-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Header con logo oficial - SIN DUPLICACIÓN */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <AiDuxCareLogo size="md" variant="icon" />
            <div>
              <h1 className="text-2xl font-bold text-[#2C3E50]">AiDuxCare</h1>
              <p className="text-xs text-[#2C3E50]/70">AI-EMR Platform</p>
            </div>
          </div>
          <p className="text-[#2C3E50]/70 text-sm">
            {authMode === 'select' && 'Selecciona tu perfil profesional'}
            {authMode === 'login' && 'Accede a tu perfil'}
            {authMode === 'register' && 'Crea tu perfil profesional'}
          </p>
        </div>

        {/* Main Card compacta */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-[#BDC3C7]/20 p-6">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-[#FF6F61]/10 border border-[#FF6F61]/20 rounded-xl">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-4 h-4 bg-[#FF6F61] rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[#FF6F61] font-semibold text-sm">Error</span>
              </div>
              {errors.map((error, index) => (
                <p key={index} className="text-[#2C3E50] text-sm">{error}</p>
              ))}
            </div>
          )}

          {/* Navegación entre modos */}
          {authMode !== 'select' && (
            <div className="flex mb-6 bg-[#F7F7F7] rounded-xl p-1">
              <button
                onClick={() => handleModeChange('login')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-[#5DA5A3] shadow-sm'
                    : 'text-[#2C3E50]/70 hover:text-[#2C3E50]'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => handleModeChange('register')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-[#5DA5A3] shadow-sm'
                    : 'text-[#2C3E50]/70 hover:text-[#2C3E50]'
                }`}
              >
                Crear Cuenta
              </button>
            </div>
          )}

          {/* Content based on mode */}
          {authMode === 'select' && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-1">Perfiles Disponibles</h2>
                <p className="text-[#2C3E50]/70 text-sm">Selecciona tu perfil para continuar</p>
              </div>
              
              <div className="space-y-2">
                {availableTherapists.map((therapist, index) => (
                  <button
                    key={index}
                    onClick={() => handleTherapistSelect(therapist)}
                    disabled={isSubmitting}
                    className="w-full p-3 text-left bg-gradient-to-r from-[#F7F7F7] to-[#A8E6CF]/20 hover:from-[#A8E6CF]/20 hover:to-[#A8E6CF]/30 border border-[#BDC3C7]/30 hover:border-[#5DA5A3]/50 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold">
                          {therapist.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#2C3E50] group-hover:text-[#5DA5A3] transition-colors">{therapist}</p>
                        <p className="text-xs text-[#2C3E50]/60">Profesional de la salud</p>
                      </div>
                      <svg className="w-4 h-4 text-[#BDC3C7] group-hover:text-[#5DA5A3] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-[#BDC3C7]/30">
                <button
                  onClick={() => handleModeChange('register')}
                  className="btn-primary w-full group"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Nuevo Perfil
                </button>
              </div>
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-1">Bienvenido de vuelta</h2>
                <p className="text-[#2C3E50]/70 text-sm">Ingresa tu nombre de perfil</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#2C3E50] mb-2">
                  Nombre del Perfil
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                  placeholder="Ingresa tu nombre de perfil"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="btn-primary w-full group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Accediendo...
                  </>
                ) : (
                  <>
                    <span>Acceder</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-1">Crear Perfil Profesional</h2>
                <p className="text-[#2C3E50]/70 text-sm">Completa tu información</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-semibold text-[#2C3E50] mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="reg-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                    placeholder="Tu nombre profesional"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                
                <div>
                  <label htmlFor="reg-specialization" className="block text-sm font-semibold text-[#2C3E50] mb-1">
                    Especialización *
                  </label>
                  <input
                    type="text"
                    id="reg-specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all"
                    placeholder="Ej: Fisioterapia Deportiva, Neurológica..."
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-semibold text-[#2C3E50] mb-1">
                      Email (Opcional)
                    </label>
                    <input
                      type="email"
                      id="reg-email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all text-sm"
                      placeholder="tu@email.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="reg-license" className="block text-sm font-semibold text-[#2C3E50] mb-1">
                      Nº Colegiado (Opcional)
                    </label>
                    <input
                      type="text"
                      id="reg-license"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#BDC3C7]/50 rounded-xl text-[#2C3E50] placeholder-[#2C3E50]/50 focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent transition-all text-sm"
                      placeholder="Número de colegiado"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim() || !formData.specialization.trim()}
                className="btn-primary w-full group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Creando Perfil...
                  </>
                ) : (
                  <>
                    <span>Crear Perfil</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer compacto */}
        <div className="text-center mt-4">
          <div className="flex items-center justify-center gap-4 text-xs text-[#2C3E50]/60">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-[#5DA5A3] rounded-full"></div>
              <span>Datos seguros</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-[#A8E6CF] rounded-full"></div>
              <span>Privacidad total</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-[#FF6F61] rounded-full"></div>
              <span>GDPR compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage;
