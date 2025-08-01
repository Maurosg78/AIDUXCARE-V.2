/**
 * @fileoverview Utilidades de validación enterprise para el wizard
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import { UserData, ValidationError, ValidationResult, WizardStep } from '@/types/wizard';
import { VALIDATION_RULES, I18N_TEXTS } from './constants';

/**
 * Valida un campo específico del formulario
 */
export const validateField = (field: keyof UserData, value: any): string | undefined => {
  const rules = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES];
  
  if (!rules) return undefined;
  
  // Validación de campo requerido
  if (rules.required && (!value || value.trim() === '')) {
    return I18N_TEXTS.errors.required;
  }
  
  // Validación de longitud mínima
  if (rules.minLength && value && value.length < rules.minLength) {
    return `${I18N_TEXTS.errors.required} (mínimo ${rules.minLength} caracteres)`;
  }
  
  // Validación de longitud máxima
  if (rules.maxLength && value && value.length > rules.maxLength) {
    return `${I18N_TEXTS.errors.required} (máximo ${rules.maxLength} caracteres)`;
  }
  
  // Validación de patrón
  if (rules.pattern && value && !rules.pattern.test(value)) {
    return I18N_TEXTS.errors[`invalid${field.charAt(0).toUpperCase() + field.slice(1)}`] || I18N_TEXTS.errors.required;
  }
  
  return undefined;
};

/**
 * Valida un paso completo del wizard
 */
export const validateStep = (step: WizardStep, userData: UserData): ValidationResult => {
  const errors: ValidationError[] = [];
  
  switch (step) {
    case WizardStep.PERSONAL_DATA:
      // Validar campos personales
      const personalFields: (keyof UserData)[] = ['firstName', 'lastName', 'birthDate', 'email', 'phone', 'password', 'confirmPassword'];
      
      personalFields.forEach(field => {
        const error = validateField(field, userData[field]);
        if (error) {
          errors.push({ field, message: error });
        }
      });
      
      // Validación especial para contraseñas
      if (userData.password && userData.confirmPassword && userData.password !== userData.confirmPassword) {
        errors.push({ field: 'confirmPassword', message: I18N_TEXTS.errors.passwordMismatch });
      }
      
      break;
      
    case WizardStep.PROFESSIONAL_DATA:
      // Validar campos profesionales
      const professionalFields: (keyof UserData)[] = ['specialty', 'licenseNumber', 'workplace', 'university', 'professionalTitle', 'experienceYears'];
      
      professionalFields.forEach(field => {
        const error = validateField(field, userData[field]);
        if (error) {
          errors.push({ field, message: error });
        }
      });
      
      break;
      
    case WizardStep.LOCATION_CONSENT:
      // Validar campos de ubicación y consentimiento
      const locationFields: (keyof UserData)[] = ['country', 'province', 'city'];
      
      locationFields.forEach(field => {
        const error = validateField(field, userData[field]);
        if (error) {
          errors.push({ field, message: error });
        }
      });
      
      // Validar consentimientos
      if (!userData.consentGDPR) {
        errors.push({ field: 'consentGDPR', message: I18N_TEXTS.errors.consentRequired });
      }
      
      if (!userData.consentHIPAA) {
        errors.push({ field: 'consentHIPAA', message: I18N_TEXTS.errors.consentRequired });
      }
      
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida la fortaleza de la contraseña
 */
export const validatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (!password) return 'weak';
  
  let score = 0;
  
  // Longitud
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complejidad
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

/**
 * Sanitiza el input del usuario
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres peligrosos
    .replace(/\s+/g, ' '); // Normalizar espacios
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida formato de teléfono
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida formato de fecha
 */
export const isValidDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * Valida que la fecha de nacimiento sea razonable
 */
export const isValidBirthDate = (date: string): boolean => {
  if (!isValidDate(date)) return false;
  
  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  return age >= 18 && age <= 120;
};

/**
 * Valida número de licencia profesional
 */
export const isValidLicenseNumber = (license: string): boolean => {
  const licenseRegex = /^[A-Z0-9]{6,12}$/;
  return licenseRegex.test(license);
};

/**
 * Valida años de experiencia
 */
export const isValidExperienceYears = (years: string): boolean => {
  const yearsNum = parseInt(years, 10);
  return !isNaN(yearsNum) && yearsNum >= 0 && yearsNum <= 50;
};

/**
 * Convierte errores de validación a formato de objeto
 */
export const errorsToObject = (errors: ValidationError[]): Record<keyof UserData, string> => {
  const errorObject: Record<keyof UserData, string> = {} as Record<keyof UserData, string>;
  
  errors.forEach(error => {
    errorObject[error.field] = error.message;
  });
  
  return errorObject;
};

/**
 * Limpia errores de validación
 */
export const clearValidationErrors = (): Record<keyof UserData, string> => {
  return {} as Record<keyof UserData, string>;
};

/**
 * Valida si el formulario está completo
 */
export const isFormComplete = (userData: UserData): boolean => {
  const requiredFields: (keyof UserData)[] = [
    'firstName', 'lastName', 'birthDate', 'email', 'phone', 'password',
    'specialty', 'licenseNumber', 'workplace', 'university', 'professionalTitle', 'experienceYears',
    'country', 'province', 'city'
  ];
  
  return requiredFields.every(field => {
    const value = userData[field];
    return value && value.toString().trim() !== '';
  }) && userData.consentGDPR && userData.consentHIPAA;
};

/**
 * Obtiene el progreso del formulario (0-100)
 */
export const getFormProgress = (userData: UserData): number => {
  const totalFields = 15; // Total de campos requeridos
  let completedFields = 0;
  
  const requiredFields: (keyof UserData)[] = [
    'firstName', 'lastName', 'birthDate', 'email', 'phone', 'password',
    'specialty', 'licenseNumber', 'workplace', 'university', 'professionalTitle', 'experienceYears',
    'country', 'province', 'city'
  ];
  
  requiredFields.forEach(field => {
    const value = userData[field];
    if (value && value.toString().trim() !== '') {
      completedFields++;
    }
  });
  
  // Agregar consentimientos
  if (userData.consentGDPR) completedFields++;
  if (userData.consentHIPAA) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
}; 