import { Session, User } from '@supabase/supabase-js';

// ID único para el segundo profesional (diferente del primer profesional)
export const OTHER_PROFESSIONAL_ID = 'prof-test-002';

// Mock de otro usuario profesional
export const otherProfessionalUser: User = {
  id: OTHER_PROFESSIONAL_ID,
  app_metadata: {
    provider: 'email'
  },
  user_metadata: {
    full_name: 'Dra. Rodríguez Pérez',
    role: 'professional'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: '',
  email: 'dra.rodriguez@aiduxcare.com'
};

// Mock de sesión de otro usuario profesional
export const otherProfessionalSession: Session = {
  access_token: 'mock-access-token-for-other-professional',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token-other',
  user: otherProfessionalUser,
  expires_at: Math.floor(Date.now() / 1000) + 3600
}; 