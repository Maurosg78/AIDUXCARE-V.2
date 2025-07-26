import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthService } from '../core/auth/firebaseAuthService';
import { ValidationService } from '../core/services/ValidationService';
import { GeolocationService } from '../core/services/GeolocationService';
import { clsx } from 'clsx';

type WizardStep = 1 | 2 | 3;

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

const authService = new FirebaseAuthService();

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  
  // Login state
  const [login, setLogin] = useState({ email: '', password: '' });
  
  // Register state - Paso 1: Datos personales
  const [personalData, setPersonalData] = useState({
    firstName: '',
    secondName: '',
    firstLastName: '',
    secondLastName: '',
    birthDate: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  
  // Register state - Paso 2: Datos profesionales
  const [professionalData, setProfessionalData] = useState({
    professionalTitle: '',
    specialty: '',
    referenceForm: '',
    university: '',
    licenseNumber: '',
    workplace: '',
    experienceYears: '',
    otherProfessionalTitle: '',
    otherSpecialty: '',
    otherReferenceForm: '',
    otherUniversity: '',
  });
  
  // Register state - Paso 3: Datos de ubicación
  const [locationData, setLocationData] = useState({
    country: '',
    province: '',
    city: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Mocks de listas profesionales y universidades (enfoque MVP España)
  const TITULOS_PROFESIONALES = [
    'Medicina', 'Fisioterapia', 'Enfermería', 'Psicología', 'Terapia Ocupacional', 
    'Nutrición', 'Kinesiología', 'Odontología', 'Matrona', 'Química y Farmacia', 
    'Fonoaudiología', 'Tecnología Médica', 'Otro', 'Ninguno'
  ];
  
  const FORMAS_REFERENCIA = [
    'Dr.', 'Dra.', 'FT', 'OT', 'LP', 'Lic.', 'Prof.', 'Mg.', 'PhD', 'Otro', 'Ninguno'
  ];
  
  const ESPECIALIDADES = {
    Medicina: ['Medicina Interna', 'Pediatría', 'Cirugía', 'Ginecología', 'Psiquiatría', 'Cardiología', 'Otro', 'Ninguna'],
    Fisioterapia: ['Deportiva', 'Respiratoria', 'Neurológica', 'Traumatológica', 'Pediátrica', 'Geriátrica', 'Otro', 'Ninguna'],
    Enfermería: ['Geriátrica', 'Pediátrica', 'Quirúrgica', 'Salud Pública', 'Otro', 'Ninguna'],
    Psicología: ['Clínica', 'Educacional', 'Organizacional', 'Forense', 'Otro', 'Ninguna'],
    'Terapia Ocupacional': ['Rehabilitación Física', 'Salud Mental', 'Pediátrica', 'Otro', 'Ninguna'],
    Nutrición: ['Clínica', 'Deportiva', 'Pública', 'Otro', 'Ninguna'],
    Kinesiología: ['Deportiva', 'Respiratoria', 'Neurológica', 'Otro', 'Ninguna'],
    Odontología: ['Ortodoncia', 'Endodoncia', 'Periodoncia', 'Otro', 'Ninguna'],
    Matrona: ['Ginecología', 'Obstetricia', 'Otro', 'Ninguna'],
    'Química y Farmacia': ['Farmacia Clínica', 'Industrial', 'Otro', 'Ninguna'],
    Fonoaudiología: ['Audiología', 'Lenguaje', 'Otro', 'Ninguna'],
    'Tecnología Médica': ['Imagenología', 'Laboratorio Clínico', 'Otro', 'Ninguna'],
    Otro: ['Otro', 'Ninguna'],
    Ninguno: ['Ninguna']
  };
  
  // Universidades españolas para MVP
  const UNIVERSIDADES = {
    España: [
      'Universidad Complutense de Madrid', 'Universidad de Barcelona', 'Universidad Autónoma de Madrid',
      'Universidad Politécnica de Madrid', 'Universidad de Valencia', 'Universidad de Sevilla',
      'Universidad del País Vasco', 'Universidad de Granada', 'Universidad de Zaragoza',
      'Universidad de Murcia', 'Universidad de Salamanca', 'Universidad de Oviedo',
      'Universidad de Santiago de Compostela', 'Universidad de Alcalá', 'Universidad Carlos III de Madrid',
      'Universidad Pompeu Fabra', 'Universidad de Navarra', 'Universidad Ramon Llull',
      'Universidad CEU San Pablo', 'Universidad Europea de Madrid', 'Otro', 'Ninguna'
    ],
    Otro: ['Otro', 'Ninguna']
  };

  // Utilidad para degradado de borde
  const gradientBorder = 'focus:outline-none focus:border-2 focus:border-blue-500 focus:bg-white';

  // Detectar ubicación automáticamente cuando se llega al paso 3
  useEffect(() => {
    if (wizardStep === 3 && !locationData.country) {
      detectUserLocation();
    }
  }, [wizardStep]);

  // Cargar lista de países al montar el componente
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const countriesList = await GeolocationService.getCountries();
      setCountries(countriesList);
    } catch (error) {
      console.warn('No se pudieron cargar los países:', error);
    }
  };

  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const detectedLocation = await GeolocationService.detectUserLocation();
      setLocationData(detectedLocation);
    } catch (error) {
      console.warn('No se pudo detectar la ubicación:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Validación en tiempo real
  const validateField = (fieldName: string, value: string, additionalValue?: string) => {
    let result: ValidationResult;
    
    switch (fieldName) {
      case 'firstName':
      case 'firstLastName':
        result = ValidationService.validateRequiredName(value);
        break;
      case 'secondName':
      case 'secondLastName':
        result = ValidationService.validateOptionalName(value);
        break;
      case 'email':
        result = ValidationService.validateEmail(value);
        break;
      case 'phone':
        result = ValidationService.validatePhone(value);
        break;
      case 'birthDate':
        result = ValidationService.validateBirthDate(value);
        break;
      case 'password':
        result = ValidationService.validatePassword(value);
        break;
      case 'confirmPassword':
        result = ValidationService.validatePasswordConfirmation(personalData.password, value);
        break;
      default:
        result = { isValid: true };
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: result.isValid ? '' : result.message || 'Error de validación'
    }));
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.signIn(login.email, login.password);
      navigate('/professional-workflow');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    if (personalData.password !== personalData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    
    if (!consent) {
      setError('Debes aceptar la política de privacidad');
      setLoading(false);
      return;
    }
    
    try {
      // Construir nombre completo desde los campos separados
      const fullName = [
        personalData.firstName,
        personalData.secondName,
        personalData.firstLastName,
        personalData.secondLastName
      ].filter(Boolean).join(' ');

      await authService.signUp(
        personalData.email,
        personalData.password,
        fullName,
        professionalData.specialty,
        {
          birthDate: personalData.birthDate,
          gender: personalData.gender,
          phone: personalData.phone,
          licenseNumber: professionalData.licenseNumber,
          workplace: professionalData.workplace,
          university: professionalData.university,
          professionalTitle: professionalData.professionalTitle,
          country: locationData.country,
          province: locationData.province,
          city: locationData.city,
          consent,
          registrationSource: 'direct',
        }
      );
      setSuccess('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => navigate('/professional-workflow'), 1000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  // Handler de recuperación de contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setResetLoading(true);
    try {
      await authService.sendVerificationEmail(resetEmail);
      setResetMsg('Enlace de recuperación enviado. Revisa tu correo.');
    } catch (err: any) {
      setResetMsg(err.message || 'No se pudo enviar el enlace.');
    } finally {
      setResetLoading(false);
    }
  };

  // Validación para avanzar al siguiente paso
  const canProceedToNext = () => {
    switch (wizardStep) {
      case 1:
        return personalData.firstName && personalData.firstLastName && personalData.birthDate && personalData.email && 
               personalData.phone && personalData.password && personalData.confirmPassword &&
               personalData.password === personalData.confirmPassword &&
               !fieldErrors.firstName && !fieldErrors.firstLastName && !fieldErrors.email && !fieldErrors.phone && 
               !fieldErrors.birthDate && !fieldErrors.password && !fieldErrors.confirmPassword;
      case 2:
        return professionalData.professionalTitle && professionalData.specialty && professionalData.referenceForm &&
               professionalData.university && professionalData.licenseNumber && professionalData.workplace;
      case 3:
        return locationData.country && locationData.province && locationData.city && consent;
      default:
        return false;
    }
  };

  // Avanzar al siguiente paso
  const nextStep = () => {
    if (wizardStep < 3 && canProceedToNext()) {
      setWizardStep(wizardStep + 1 as WizardStep);
    }
  };

  // Retroceder al paso anterior
  const prevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1 as WizardStep);
    }
  };

  // Renderizar paso del wizard
  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="w-full max-w-2xl">
            <div className="flex flex-col items-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-bold text-lg mb-2 shadow-md">
                1/3
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Datos personales</h2>
              <p className="text-neutral-600 font-normal text-center mb-4">Introduce tus datos básicos para comenzar el registro.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Nombre *</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: Mauricio"
                  value={personalData.firstName}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, firstName: e.target.value }));
                    validateField('firstName', e.target.value);
                  }}
                  onBlur={() => validateField('firstName', personalData.firstName)}
                  required
                  disabled={loading}
                />
                {fieldErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Segundo nombre</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: Andrés"
                  value={personalData.secondName}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, secondName: e.target.value }));
                    validateField('secondName', e.target.value);
                  }}
                  onBlur={() => validateField('secondName', personalData.secondName)}
                  disabled={loading}
                />
                {fieldErrors.secondName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.secondName}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Primer apellido *</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: Sobarzo"
                  value={personalData.firstLastName}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, firstLastName: e.target.value }));
                    validateField('firstLastName', e.target.value);
                  }}
                  onBlur={() => validateField('firstLastName', personalData.firstLastName)}
                  required
                  disabled={loading}
                />
                {fieldErrors.firstLastName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.firstLastName}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Segundo apellido</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: González"
                  value={personalData.secondLastName}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, secondLastName: e.target.value }));
                    validateField('secondLastName', e.target.value);
                  }}
                  onBlur={() => validateField('secondLastName', personalData.secondLastName)}
                  disabled={loading}
                />
                {fieldErrors.secondLastName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.secondLastName}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  value={personalData.birthDate}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, birthDate: e.target.value }));
                    validateField('birthDate', e.target.value);
                  }}
                  onBlur={() => validateField('birthDate', personalData.birthDate)}
                  required
                  disabled={loading}
                />
                {fieldErrors.birthDate && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.birthDate}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Email</label>
                <input
                  type="email"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: mauricio@aiduxcare.com"
                  value={personalData.email}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, email: e.target.value }));
                    validateField('email', e.target.value);
                  }}
                  onBlur={() => validateField('email', personalData.email)}
                  required
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Teléfono personal</label>
                <input
                  type="tel"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: +34 612 345 678"
                  value={personalData.phone}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, phone: e.target.value }));
                    validateField('phone', e.target.value);
                  }}
                  onBlur={() => validateField('phone', personalData.phone)}
                  required
                  disabled={loading}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">
                  Género <span className="text-xs text-gray-400">(opcional)</span>
                </label>
                <select
                  className="w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 transition-all focus:outline-none focus:border-2 focus:border-blue-500"
                  value={personalData.gender}
                  onChange={e => setPersonalData(p => ({ ...p, gender: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">Selecciona</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="no-binario">No binario</option>
                  <option value="prefiero-no-decir">Prefiero no decir</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-base text-neutral-700 font-normal mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all pr-12', gradientBorder)}
                  placeholder="Mínimo 8 caracteres"
                  value={personalData.password}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, password: e.target.value }));
                    validateField('password', e.target.value);
                  }}
                  onBlur={() => validateField('password', personalData.password)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  👁️
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-base text-neutral-700 font-normal mb-1">Repetir contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all pr-12', gradientBorder)}
                  placeholder="Repite la contraseña"
                  value={personalData.confirmPassword}
                  onChange={e => {
                    setPersonalData(p => ({ ...p, confirmPassword: e.target.value }));
                    validateField('confirmPassword', e.target.value);
                  }}
                  onBlur={() => validateField('confirmPassword', personalData.confirmPassword)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  👁️
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="w-full max-w-2xl">
            <div className="flex flex-col items-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-bold text-lg mb-2 shadow-md">
                2/3
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Datos profesionales</h2>
              <p className="text-neutral-600 font-normal text-center mb-4">Información sobre tu formación y experiencia profesional.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Título profesional</label>
                <select
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 transition-all', gradientBorder)}
                  value={professionalData.professionalTitle}
                  onChange={e => setProfessionalData(p => ({ ...p, professionalTitle: e.target.value }))}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona un título</option>
                  {TITULOS_PROFESIONALES.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
                {professionalData.professionalTitle === 'Otro' && (
                  <input
                    type="text"
                    className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all mt-2', gradientBorder)}
                    placeholder="Especifica tu título"
                    value={professionalData.otherProfessionalTitle}
                    onChange={e => setProfessionalData(p => ({ ...p, otherProfessionalTitle: e.target.value }))}
                    disabled={loading}
                  />
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Especialidad</label>
                <select
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 transition-all', gradientBorder)}
                  value={professionalData.specialty}
                  onChange={e => setProfessionalData(p => ({ ...p, specialty: e.target.value }))}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona una especialidad</option>
                  {ESPECIALIDADES[professionalData.professionalTitle as keyof typeof ESPECIALIDADES]?.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
                {professionalData.specialty === 'Otro' && (
                  <input
                    type="text"
                    className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all mt-2', gradientBorder)}
                    placeholder="Especifica tu especialidad"
                    value={professionalData.otherSpecialty}
                    onChange={e => setProfessionalData(p => ({ ...p, otherSpecialty: e.target.value }))}
                    disabled={loading}
                  />
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Forma de referencia</label>
                <select
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 transition-all', gradientBorder)}
                  value={professionalData.referenceForm}
                  onChange={e => setProfessionalData(p => ({ ...p, referenceForm: e.target.value }))}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona una forma</option>
                  {FORMAS_REFERENCIA.map(form => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </select>
                {professionalData.referenceForm === 'Otro' && (
                  <input
                    type="text"
                    className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all mt-2', gradientBorder)}
                    placeholder="Especifica tu forma de referencia"
                    value={professionalData.otherReferenceForm}
                    onChange={e => setProfessionalData(p => ({ ...p, otherReferenceForm: e.target.value }))}
                    disabled={loading}
                  />
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Universidad/Institución</label>
                <select
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 transition-all', gradientBorder)}
                  value={professionalData.university}
                  onChange={e => setProfessionalData(p => ({ ...p, university: e.target.value }))}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona una universidad</option>
                  {UNIVERSIDADES[locationData.country as keyof typeof UNIVERSIDADES]?.map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                  {UNIVERSIDADES['España'].map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
                {professionalData.university === 'Otro' && (
                  <input
                    type="text"
                    className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all mt-2', gradientBorder)}
                    placeholder="Especifica tu universidad"
                    value={professionalData.otherUniversity}
                    onChange={e => setProfessionalData(p => ({ ...p, otherUniversity: e.target.value }))}
                    disabled={loading}
                  />
                )}
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Número de colegiado</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: 12345"
                  value={professionalData.licenseNumber}
                  onChange={e => setProfessionalData(p => ({ ...p, licenseNumber: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Centro de trabajo</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: Hospital San Juan"
                  value={professionalData.workplace}
                  onChange={e => setProfessionalData(p => ({ ...p, workplace: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Años de experiencia</label>
                <input
                  type="number"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: 5"
                  value={professionalData.experienceYears}
                  onChange={e => setProfessionalData(p => ({ ...p, experienceYears: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="w-full max-w-2xl">
            <div className="flex flex-col items-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white font-bold text-lg mb-2 shadow-md">
                3/3
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Datos de ubicación</h2>
              <p className="text-neutral-600 font-normal text-center mb-4">Información sobre tu ubicación geográfica.</p>
            </div>
            
            {/* Botón de detección automática */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Detección automática de ubicación</h3>
                  <p className="text-sm text-blue-700">
                    Permite que detectemos automáticamente tu país, provincia y ciudad.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={detectUserLocation}
                  disabled={isDetectingLocation}
                  className={clsx(
                    'btn-gradient w-auto px-4 py-2',
                    isDetectingLocation ? 'opacity-50 cursor-not-allowed' : ''
                  )}
                >
                  {isDetectingLocation ? 'Detectando...' : 'Detectar ubicación'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">País</label>
                <select
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 transition-all', gradientBorder)}
                  value={locationData.country}
                  onChange={e => setLocationData(l => ({ ...l, country: e.target.value }))}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona un país</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base text-neutral-700 font-normal mb-1">Provincia/Estado</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: Madrid"
                  value={locationData.province}
                  onChange={e => setLocationData(l => ({ ...l, province: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-base text-neutral-700 font-normal mb-1">Ciudad</label>
                <input
                  type="text"
                  className={clsx('w-full border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                  placeholder="Ejemplo: Madrid"
                  value={locationData.city}
                  onChange={e => setLocationData(l => ({ ...l, city: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  required
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="consent" className="text-sm text-neutral-700">
                  Acepto la <a href="/privacy-policy" className="text-accent underline" target="_blank" rel="noopener noreferrer">política de privacidad</a> y el tratamiento de mis datos según GDPR.
                </label>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <main className="w-full max-w-2xl flex flex-col items-center bg-white rounded-3xl shadow-xl p-12 border border-neutral/40">
        <h1 className="text-4xl font-heading font-bold text-primary mb-2 text-center">
          Bienvenido a <span className="text-gradient">AiDuxCare</span>
        </h1>
        <p className="text-lg text-primary/80 mb-8 text-center max-w-xl mx-auto">
          Asistente clínico impulsado por inteligencia artificial.<br />
          Pensado para que dediques más tiempo a tus pacientes, menos a la gestión.
        </p>
        
        {tab === 'login' ? (
          <>
            {error && <div className="text-accent font-medium mb-4 text-center">{error}</div>}
            {success && <div className="text-success font-medium mb-4 text-center">{success}</div>}
            
            <form className="w-full max-w-md flex flex-col gap-7" onSubmit={handleLogin}>
              <input
                type="email"
                className={clsx('border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                placeholder="Correo electrónico"
                value={login.email}
                onChange={e => setLogin(l => ({ ...l, email: e.target.value }))}
                required
                disabled={loading}
              />
              <input
                type="password"
                className={clsx('border border-neutral/40 rounded-lg px-4 py-2 text-base text-neutral-700 placeholder:text-neutral-400 transition-all', gradientBorder)}
                placeholder="Contraseña"
                value={login.password}
                onChange={e => setLogin(l => ({ ...l, password: e.target.value }))}
                required
                disabled={loading}
              />
              <div className="flex justify-end text-sm mb-2">
                <button type="button" className="text-purple-600 hover:underline" onClick={() => setShowReset(true)}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <button
                type="submit"
                className="btn-gradient w-full"
                disabled={loading}
              >
                {loading ? 'Accediendo...' : 'Iniciar sesión'}
              </button>
              
              <button
                type="button"
                className="btn-gradient w-full"
                onClick={() => setTab('register')}
              >
                Registrarse
              </button>
            </form>
            
            {showReset && (
              <div className="w-full max-w-md mt-8 bg-white border border-accent rounded-2xl p-7 flex flex-col items-center shadow-md">
                <h2 className="text-lg font-semibold mb-2 text-accent">Recuperar contraseña</h2>
                <form className="w-full flex flex-col gap-4" onSubmit={handleResetPassword}>
                  <input
                    type="email"
                    className="border border-neutral/40 rounded-xl px-4 py-3 text-lg bg-white placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Correo electrónico"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    disabled={resetLoading}
                  />
                  <button
                    type="submit"
                    className={`bg-primary text-white font-semibold py-2 rounded-full shadow-md border-none ${resetEmail ? 'hover:bg-primary/90' : 'opacity-60 cursor-not-allowed'}`}
                    disabled={resetLoading || !resetEmail}
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-neutral-dark mt-2 hover:underline"
                    onClick={() => { setShowReset(false); setResetMsg(null); }}
                  >
                    Cancelar
                  </button>
                </form>
                {resetMsg && <div className={`mt-2 text-center ${resetMsg.includes('enviado') ? 'text-success' : 'text-accent'}`}>{resetMsg}</div>}
              </div>
            )}
          </>
        ) : (
          <>
            {error && <div className="text-accent font-medium mb-4 text-center">{error}</div>}
            {success && <div className="text-success font-medium mb-4 text-center">{success}</div>}
            
            <form className="w-full flex flex-col gap-7" onSubmit={handleRegister}>
              {renderWizardStep()}
              
              <div className="flex justify-between mt-6">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    className="btn-gradient w-full mr-2"
                    onClick={prevStep}
                    disabled={loading}
                  >
                    Anterior
                  </button>
                )}
                {wizardStep < 3 ? (
                  <button
                    type="button"
                    className={`btn-gradient w-full ${!canProceedToNext() || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={nextStep}
                    disabled={!canProceedToNext() || loading}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={`btn-gradient w-full ${!canProceedToNext() || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canProceedToNext() || loading}
                  >
                    {loading ? 'Registrando...' : 'Finalizar registro'}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
        
        <div className="mt-10 text-xs text-neutral/80 text-center">
          &copy; {new Date().getFullYear()} AiDuxCare. Software médico de nivel hospitalario. Cumple HIPAA/GDPR/XAI.
        </div>
      </main>
    </div>
  );
};

export default WelcomePage; 