/**
 * @fileoverview Hook principal del wizard enterprise
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  WizardState, 
  WizardActions, 
  UseWizardReturn, 
  UserData, 
  WizardStep, 
  TabType,
  ValidationResult 
} from '@/types/wizard';
import { validateStep } from '@/utils/validation';
import { announceToScreenReader } from '@/utils/accessibility';
import { WIZARD_CONFIG, I18N_TEXTS, ANALYTICS_EVENTS } from '@/utils/constants';

// Estado inicial del usuario
const initialUserData: UserData = {
  firstName: '',
  lastName: '',
  birthDate: '',
  email: '',
  phone: '',
  gender: '',
  password: '',
  confirmPassword: '',
  specialty: '',
  licenseNumber: '',
  workplace: '',
  university: '',
  professionalTitle: '',
  experienceYears: '',
  country: '',
  province: '',
  city: '',
  consentGDPR: false,
  consentHIPAA: false
};

/**
 * Hook principal del wizard
 */
export const useWizard = (): UseWizardReturn => {
  const navigate = useNavigate();
  const [state, setState] = useState<WizardState>({
    currentStep: WizardStep.PERSONAL_DATA,
    activeTab: TabType.REGISTER,
    userData: { ...initialUserData },
    errors: {},
    loading: false,
    isComplete: false
  });

  const formRef = useRef<HTMLFormElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-guardado del formulario
  useEffect(() => {
    if (WIZARD_CONFIG.enableAutoSave) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem('wizard-form-data', JSON.stringify(state.userData));
      }, 1000);

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }
  }, [state.userData]);

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem('wizard-form-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setState(prev => ({
          ...prev,
          userData: { ...initialUserData, ...parsedData }
        }));
      } catch (error) {
        console.warn('Error loading saved form data:', error);
      }
    }
  }, []);

  // Validar paso actual
  const validateCurrentStep = useCallback((): ValidationResult => {
    return validateStep(state.currentStep, state.userData);
  }, [state.currentStep, state.userData]);

  // Navegar al siguiente paso
  const nextStep = useCallback(() => {
    const validation = validateCurrentStep();
    
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        errors: validation.errors.reduce((acc, error) => ({
          ...acc,
          [error.field]: error.message
        }), {})
      }));
      
      announceToScreenReader('Error de validación. Revisa los campos marcados.');
      return;
    }

    if (state.currentStep < 2) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        errors: {}
      }));
      
      announceToScreenReader(`Paso ${state.currentStep + 2} de 3`);
      
      // Analytics
      if (WIZARD_CONFIG.enableAnalytics) {
        // trackStepComplete(state.currentStep);
      }
    }
  }, [state.currentStep, validateCurrentStep]);

  // Navegar al paso anterior
  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        errors: {}
      }));
      
      announceToScreenReader(`Paso ${state.currentStep} de 3`);
    }
  }, [state.currentStep]);

  // Establecer paso específico
  const setStep = useCallback((step: WizardStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      errors: {}
    }));
  }, []);

  // Actualizar datos del usuario
  const updateUserData = useCallback((field: keyof UserData, value: any) => {
    setState(prev => ({
      ...prev,
      userData: {
        ...prev.userData,
        [field]: value
      },
      errors: {
        ...prev.errors,
        [field]: undefined // Limpiar error del campo
      }
    }));
  }, []);

  // Validar paso específico
  const validateStepAction = useCallback((step: WizardStep): ValidationResult => {
    return validateStep(step, state.userData);
  }, [state.userData]);

  // Enviar registro
  const submitRegistration = useCallback(async () => {
    const validation = validateCurrentStep();
    
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        errors: validation.errors.reduce((acc, error) => ({
          ...acc,
          [error.field]: error.message
        }), {})
      }));
      
      announceToScreenReader('Error de validación. Revisa los campos marcados.');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Simulación de registro
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Limpiar datos guardados
      localStorage.removeItem('wizard-form-data');
      
      setState(prev => ({
        ...prev,
        loading: false,
        isComplete: true
      }));
      
      announceToScreenReader('Registro completado exitosamente');
      
      // Analytics
      if (WIZARD_CONFIG.enableAnalytics) {
        // trackRegistrationComplete(true);
      }
      
      // Navegar al workflow profesional
      navigate('/professional-workflow');
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        errors: {
          general: 'Error al completar el registro. Inténtalo de nuevo.'
        }
      }));
      
      announceToScreenReader('Error al completar el registro');
      
      // Analytics
      if (WIZARD_CONFIG.enableAnalytics) {
        // trackRegistrationComplete(false);
      }
    }
  }, [validateCurrentStep, navigate]);

  // Cambiar tab activo
  const setActiveTab = useCallback((tab: TabType) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      errors: {}
    }));
  }, []);

  // Limpiar errores
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {}
    }));
  }, []);

  // Establecer error específico
  const setFieldError = useCallback((field: keyof UserData, error: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error
      }
    }));
  }, []);

  // Resetear wizard
  const resetWizard = useCallback(() => {
    setState({
      currentStep: WizardStep.PERSONAL_DATA,
      activeTab: TabType.REGISTER,
      userData: { ...initialUserData },
      errors: {},
      loading: false,
      isComplete: false
    });
    
    localStorage.removeItem('wizard-form-data');
  }, []);

  // Obtener progreso del formulario
  const getProgress = useCallback(() => {
    const totalSteps = 3;
    return Math.round(((state.currentStep + 1) / totalSteps) * 100);
  }, [state.currentStep]);

  // Verificar si se puede avanzar
  const canProceedToNextStep = useCallback(() => {
    const validation = validateCurrentStep();
    return validation.isValid;
  }, [validateCurrentStep]);

  // Verificar si se puede retroceder
  const canProceedToPrevStep = useCallback(() => {
    return state.currentStep > 0;
  }, [state.currentStep]);

  // Verificar si se puede enviar
  const canSubmit = useCallback(() => {
    return state.currentStep === 2 && canProceedToNextStep() && !state.loading;
  }, [state.currentStep, canProceedToNextStep, state.loading]);

  const actions: WizardActions = {
    nextStep,
    prevStep,
    setStep,
    updateUserData,
    validateStep: validateStepAction,
    submitRegistration
  };

  return {
    state,
    actions: {
      ...actions,
      setActiveTab,
      clearErrors,
      setFieldError,
      resetWizard,
      getProgress,
      canProceedToNextStep,
      canProceedToPrevStep,
      canSubmit
    }
  };
}; 