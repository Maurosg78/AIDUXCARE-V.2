import { useCallback } from 'react';
import { useProfessionalProfile } from '@/context/ProfessionalProfileContext';
import { analyzeWithVertexProxy } from '@/services/vertex-ai-service-firebase-canada';

export const useCanadianVertexAI = () => {
  const { profile } = useProfessionalProfile();

  const analyzeWithProfile = useCallback(async (transcript: string) => {
    return await analyzeWithVertexProxy({
      action: 'analyze',
      transcript,
      professionalProfile: profile
    });
  }, [profile]);

  return {
    analyzeWithProfile,
    profile,
    isProfileReady: !!profile,
    hasSpecialty: !!profile?.specialty,
    specialtyInfo: {
      specialty: profile?.specialty || 'general',
      experience: profile?.experienceYears || 'standard',
      techniques: profile?.specialty?.includes('ortopedia') ? ['dry needling', 'manual therapy', 'kinesio taping'] : []
    }
  };
};
