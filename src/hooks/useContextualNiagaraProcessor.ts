import { useState, useEffect } from 'react';
import { ProfessionalContextManager } from '../core/prompts/ProfessionalContext';
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useContextualNiagaraProcessor = () => {
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);

  useEffect(() => {
    loadProfessionalProfile();
  }, []);

  const loadProfessionalProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profileDoc = await getDoc(doc(firestore, 'professionals', user.uid));
        if (profileDoc.exists()) {
          setProfessionalProfile(profileDoc.data());
        }
      } else {
        // Perfil por defecto para desarrollo
        setProfessionalProfile({
          specialty: ['MSK'],
          country: 'ES',
          licenseNumber: 'DEMO-001'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Usar perfil por defecto
      setProfessionalProfile({
        specialty: ['MSK'],
        country: 'ES'
      });
    }
  };

  const processWithContext = async (transcript: string) => {
    if (!professionalProfile) {
      console.warn('No professional profile loaded, using defaults');
      return null;
    }

    const contextualPrompt = ProfessionalContextManager.generateContextualPrompt(
      transcript,
      professionalProfile
    );

    console.log('[CONTEXTUAL] Using profile:', professionalProfile);
    console.log('[CONTEXTUAL] Specialty tests included for:', professionalProfile.specialty);
    
    // Llamar a IA con prompt contextualizado
    // ... resto del procesamiento
    
    return contextualPrompt;
  };

  return {
    processWithContext,
    professionalProfile
  };
};
