/**
 * ProfessionalProfileContext - Contexto global para perfil profesional
 * Maneja estado del wizard y persistencia en Firestore
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { getEmailVerificationSettings } from '../lib/firebaseActionCode';

export interface ProfessionalProfile {
  fullName: string;
  professionalTitle: string;
  email: string;
  country: string;
  province: string;
  city: string;
  phone?: string;
  licenseNumber?: string;
  specialty?: string;
  university?: string;
  experienceYears?: string;
  workplace?: string;
  consentGranted: boolean;
  registrationStatus: 'incomplete' | 'complete';
  createdAt?: unknown; // Firestore Timestamp
  updatedAt?: unknown; // Firestore Timestamp
}

// Perfil por defecto seguro para evitar errores de undefined
const defaultProfile: ProfessionalProfile = {
  fullName: '',
  professionalTitle: '',
  email: '',
  country: '',
  province: '',
  city: '',
  phone: '',
  licenseNumber: '',
  specialty: '',
  university: '',
  experienceYears: '',
  workplace: '',
  consentGranted: false,
  registrationStatus: 'incomplete',
  createdAt: null as unknown,
  updatedAt: null as unknown
};

export interface WizardState {
  currentStep: number;
  data: ProfessionalProfile;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

interface ProfessionalProfileContextType {
  wizardState: WizardState;
  updateWizardData: (field: keyof ProfessionalProfile, value: string | boolean) => void;
  setCurrentStep: (step: number) => void;
  validateEmail: (email: string) => Promise<boolean>;
  submitRegistration: () => Promise<{ success: boolean; message: string; userId?: string }>;
  clearWizardState: () => void;
  clearProfile: () => void;
  getProfessionalProfile: (uid: string) => Promise<ProfessionalProfile | null>;
}

const ProfessionalProfileContext = createContext<ProfessionalProfileContextType | undefined>(undefined);

export const useProfessionalProfile = () => {
  const context = useContext(ProfessionalProfileContext);
  if (!context) {
    throw new Error('useProfessionalProfile must be used within a ProfessionalProfileProvider');
  }
  return context;
};

interface ProfessionalProfileProviderProps {
  children: ReactNode;
}

export const ProfessionalProfileProvider: React.FC<ProfessionalProfileProviderProps> = ({ children }) => {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    data: defaultProfile, // Usar el perfil por defecto seguro
    errors: {},
    isSubmitting: false
  });

  const updateWizardData = useCallback((field: keyof ProfessionalProfile, value: string | boolean) => {
    setWizardState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      },
      errors: {
        ...prev.errors,
        [field]: '' // Clear error when field is updated
      }
    }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setWizardState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const validateEmail = useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Verificar en Firebase Auth
      const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (methods.length > 0) {
        return false; // Email ya existe
      }

      // Verificar en Firestore
      const usersRef = collection(db, 'users');
      const emailQuery = await getDoc(doc(usersRef, normalizedEmail));
      if (emailQuery.exists()) {
        return false; // Email ya existe en Firestore
      }

      return true; // Email disponible
    } catch (error) {
      console.error('Error validating email:', error);
      return false;
    }
  }, []);

  const submitRegistration = useCallback(async (): Promise<{ success: boolean; message: string; userId?: string }> => {
    setWizardState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const { data } = wizardState;

      // Validar datos requeridos
      if (!data.fullName || !data.email || !data.professionalTitle || !data.country || !data.province || !data.city) {
        return {
          success: false,
          message: 'Todos los campos obligatorios deben estar completos'
        };
      }

      // Validar email
      const isEmailAvailable = await validateEmail(data.email);
      if (!isEmailAvailable) {
        return {
          success: false,
          message: 'Este email ya está registrado en el sistema'
        };
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        'tempPassword123!' // Contraseña temporal que será cambiada
      );

      const userId = userCredential.user.uid;

      // Enviar email de verificación
      await sendEmailVerification(userCredential.user, getEmailVerificationSettings());

      // Guardar perfil completo en Firestore
      const userDoc = doc(db, 'users', userId);
      await setDoc(userDoc, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false,
        isActive: false
      });

      // Limpiar estado del wizard
      clearWizardState();

      return {
        success: true,
        message: 'Registro exitoso. Revisa tu email para activar tu cuenta.',
        userId
      };

    } catch (error: unknown) {
      console.error('Error in registration:', error);
      
      const firebaseError = error as { code?: string; message?: string };
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        return {
          success: false,
          message: 'Este email ya está registrado en el sistema'
        };
      }

      return {
        success: false,
        message: 'Error interno del sistema. Inténtalo de nuevo.'
      };
    } finally {
      setWizardState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [wizardState, validateEmail]);

  const clearWizardState = useCallback(() => {
    setWizardState({
      currentStep: 1,
      data: {
        fullName: '',
        professionalTitle: '',
        email: '',
        country: '',
        province: '',
        city: '',
        phone: '',
        licenseNumber: '',
        specialty: '',
        university: '',
        experienceYears: '',
        workplace: '',
        consentGranted: false,
        registrationStatus: 'incomplete'
      },
      errors: {},
      isSubmitting: false
    });
  }, []);

  const clearProfile = useCallback(() => {
    setWizardState({
      currentStep: 1,
      data: defaultProfile,
      errors: {},
      isSubmitting: false
    });
  }, []);

  const getProfessionalProfile = useCallback(async (uid: string): Promise<ProfessionalProfile | null> => {
    try {
      const userDoc = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists()) {
        return null;
      }

      const userData = userSnapshot.data();
      return {
        fullName: userData.fullName || '',
        professionalTitle: userData.professionalTitle || '',
        email: userData.email || '',
        country: userData.country || '',
        province: userData.province || '',
        city: userData.city || '',
        phone: userData.phone || '',
        licenseNumber: userData.licenseNumber || '',
        specialty: userData.specialty || '',
        university: userData.university || '',
        experienceYears: userData.experienceYears || '',
        workplace: userData.workplace || '',
        consentGranted: userData.consentGranted || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        registrationStatus: userData.registrationStatus || 'incomplete'
      };
    } catch (error) {
      console.error('Error getting professional profile:', error);
      return null;
    }
  }, []);

  const contextValue: ProfessionalProfileContextType = {
    wizardState,
    updateWizardData,
    setCurrentStep,
    validateEmail,
    submitRegistration,
    clearWizardState,
    clearProfile,
    getProfessionalProfile
  };

  return (
    <ProfessionalProfileContext.Provider value={contextValue}>
      {children}
    </ProfessionalProfileContext.Provider>
  );
};
