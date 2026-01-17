import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useProfessionalProfile } from '../context/ProfessionalProfileContext';
import { isProfessionalProfileReady, isProfileComplete } from '../utils/professionalProfileValidation';

import logger from '@/shared/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireEmailVerification = true 
}) => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading, error: profileError, errorType: profileErrorType, retryProfileLoad } = useProfessionalProfile();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const location = useLocation();
  // FIX: Prevenir loop infinito - trackear si ya redirigimos
  const hasRedirectedRef = useRef(false);
  const lastPathRef = useRef<string>('');

  // WO-AUTH-ONB-FLOW-FIX-04 B: Usar Firebase Auth emailVerified directamente (no Firestore)
  useEffect(() => {
    if (user && requireEmailVerification && emailVerified === null) {
      setCheckingEmail(true);
      try {
        // WO-AUTH-ONB-FLOW-FIX-04 B: emailVerified viene de Firebase Auth, no de Firestore
        // Source of truth: auth.currentUser.emailVerified
        if (!user.email) {
          setEmailVerified(false);
        } else {
          // Firebase Auth ya tiene emailVerified en el objeto user
          setEmailVerified(user.emailVerified || false);
        }
      } catch (error) {
        logger.error('Error checking email verification:', error);
        setEmailVerified(false);
      } finally {
        setCheckingEmail(false);
      }
    } else if (!requireEmailVerification && emailVerified === null) {
      setEmailVerified(true);
    }
  }, [user?.uid, user?.email, user?.emailVerified, requireEmailVerification]);

  // WO-AUTH-GUARD-ONB-DATA-01: Soft-fail - Si hay error de perfil pero usuario autenticado, mostrar error recuperable
  // WO-AUTH-GUARD-ONB-DATA-01-CLOSE: Prevenir loops de retry
  // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 ToDo 3: Usar errorType del contexto para clasificación precisa
  if (user && !loading && !profileLoading && profileError) {
    // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04: Usar errorType del contexto si está disponible
    const isBlockedByClient = profileErrorType === 'blocked' ||
                             profileError.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
                             profileError.message?.includes('blocked');
    
    const isPermissionError = profileErrorType === 'permission' ||
                             profileError.message?.includes('permission') || 
                             profileError.message?.includes('PERMISSION_DENIED') ||
                             (profileError as any).code === 'permission-denied';
    
    const isNetworkError = profileErrorType === 'network' ||
                          profileError.message?.includes('network') || 
                          profileError.message?.includes('offline') ||
                          profileError.message?.includes('Failed to fetch');
    
    const handleRetry = () => {
      // WO-AUTH-GUARD-ONB-DATA-01-CLOSE: Prevenir múltiples clicks
      if (profileLoading) return;
      retryProfileLoad();
    };
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-10 w-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Profile
          </h1>
          <p className="text-gray-600 mb-4">
            {isBlockedByClient 
              ? 'We couldn\'t load your profile. This may be caused by an ad blocker or browser extension blocking Firestore access.'
              : isPermissionError
              ? 'We couldn\'t load your profile due to a permissions issue. Please contact support if this persists.'
              : isNetworkError
              ? 'We couldn\'t load your profile. Please check your network connection and try again.'
              : 'We couldn\'t load your profile. Please try again.'}
          </p>
          {isBlockedByClient && (
            <p className="text-sm text-gray-500 mb-6">
              Please disable ad blockers for this site if applicable, or check your browser settings.
            </p>
          )}
          <button
            onClick={handleRetry}
            disabled={profileLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {profileLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Retrying...
              </>
            ) : (
              'Retry'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (loading || checkingEmail || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-light">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // WO-13: En modo piloto, NO usar emailVerified para routing
  // Cloudflare Access valida identidad, perfil manda, no el email
  // Solo verificar email si NO es modo piloto (cuando requireEmailVerification es explícitamente true y no es piloto)
  // En piloto, requireEmailVerification debería ser false
  if (requireEmailVerification && emailVerified === false && user.email) {
    // WO-13: En piloto, esto NO debería ejecutarse, pero lo mantenemos por compatibilidad
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  // WO-AUTH-GATE-LOOP-06 ToDo 2: Allowlist de onboarding routes
  // WO-AUTH-ONB-UNIFY-03 A2: Gate único por users/{uid} y registrationStatus
  // Source of truth: users/{uid} (ProfessionalProfileContext)
  // Si users/{uid} no existe o registrationStatus !== 'complete' → /professional-onboarding
  // Si está complete → home/product
  // WO-AUTH-VERIFYEMAIL-ROUTE-05: Excluir rutas públicas y de verificación
  const isOnboardingRoute = location.pathname === '/onboarding' || 
                           location.pathname === '/professional-onboarding' || 
                           location.pathname === '/resume-onboarding' ||
                           location.pathname.startsWith('/professional-onboarding/'); // Rutas internas del wizard
  
  const isPublicRoute = location.pathname === '/verify-email' ||
                       location.pathname === '/email-verified' ||
                       location.pathname === '/login' ||
                       location.pathname === '/register' ||
                       location.pathname === '/auth/action';
  
  // Reset redirect flag si cambiamos de ruta
  if (lastPathRef.current !== location.pathname) {
    hasRedirectedRef.current = false;
    lastPathRef.current = location.pathname;
  }
  
  // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 ToDo 3: Separar "incomplete por verdad" vs "unknown por red"
  // Solo evaluar redirección si NO estamos en una ruta de onboarding o pública
  // Y si NO hemos redirigido ya en esta ruta
  if (!isOnboardingRoute && !isPublicRoute && !hasRedirectedRef.current) {
    // Si no hay perfil cargado todavía, esperar (no redirigir durante carga inicial)
    if (profileLoading) {
      // Ya hay un loading state arriba, no hacer nada aquí
    } else if (profileError) {
      // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 ToDo 3: Si hay error de red/blocked, NO redirigir a onboarding
      // El soft-fail UI ya se muestra arriba (líneas 57-121)
      // NO hacer nada aquí - dejar que el usuario use el botón Retry
      logger.info("[AUTHGUARD] Profile error detected, NOT redirecting to onboarding", {
        error: profileError.message,
        hasProfile: !!profile
      });
      // NO redirigir - el soft-fail UI ya está mostrando el error recuperable
    } else if (!profile) {
      // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 ToDo 3: Solo redirigir si confirmamos "not found" (no error de red)
      // Si llegamos aquí sin profileError, significa que getDoc retornó "not found" (no error)
      hasRedirectedRef.current = true; // Marcar que ya redirigimos
<<<<<<< ours
      logger.info("[AUTHGUARD] No profile found (confirmed 'not found'), redirecting to professional onboarding");
      return <Navigate to="/professional-onboarding" replace />;
    } else {
      // WO-13: Usar isProfileComplete como fuente única de verdad
      // NO usar registrationStatus directamente, usar el criterio unificado
      const profileIsComplete = isProfileComplete(profile);
      
      if (!profileIsComplete) {
        // Perfil incompleto según criterio WO-13
        hasRedirectedRef.current = true; // Marcar que ya redirigimos
        logger.info("[AUTHGUARD] Profile incomplete (WO-13 criteria), redirecting to professional onboarding", {
          registrationStatus: profile.registrationStatus,
          hasFirstName: !!(profile.fullName?.split(' ')[0] || profile.displayName?.split(' ')[0]),
          hasProfessionalTitle: !!(profile.professionalTitle || profile.profession),
          hasSpecialty: !!profile.specialty,
          hasPracticeCountry: !!(profile.practiceCountry || profile.country),
          hasPilotConsent: profile.pilotConsent?.accepted === true
=======

      if (!profile) {
        logger.info("[AUTHGUARD] No profile found (confirmed 'not found'), redirecting to professional onboarding");
      } else {
        // WO-21: DEBUG - Log detallado de por qué el perfil se considera incompleto
        const firstName = profile.fullName?.split(' ')[0] || profile.displayName?.split(' ')[0] || '';
        const hasFirstName = firstName.trim() !== '';
        const hasProfessionalTitle = !!((profile.professionalTitle && profile.professionalTitle.trim() !== '') || (profile.profession && profile.profession.trim() !== ''));
        const hasSpecialty = !!(profile.specialty && profile.specialty.trim() !== '');
        const practiceCountry = profile.practiceCountry || profile.country || '';
        const hasPracticeCountry = practiceCountry.trim() !== '';
        const hasPilotConsent = (profile as any).pilotConsent?.accepted === true;

        // WO-21: Calcular qué campos faltan explícitamente
        const missingFields = {
          firstName: !hasFirstName,
          professionalTitle: !hasProfessionalTitle,
          specialty: !hasSpecialty,
          practiceCountry: !hasPracticeCountry,
          pilotConsent: !hasPilotConsent
        };
        const missingFieldsList = Object.entries(missingFields)
          .filter(([_, missing]) => missing)
          .map(([field]) => field);

        // WO-21: Log directo y visible para diagnóstico
        const missingFieldsStr = missingFieldsList.length > 0 ? missingFieldsList.join(', ') : 'NONE';
        console.error('[AUTHGUARD] ❌ Profile INCOMPLETE - Missing fields:', missingFieldsStr, {
          hasFirstName,
          hasProfessionalTitle,
          hasSpecialty,
          hasPracticeCountry,
          hasPilotConsent,
          practiceCountry: practiceCountry || 'EMPTY',
          country: profile.country || 'EMPTY',
          pilotConsent: (profile as any).pilotConsent || 'MISSING'
        });

        logger.info("[AUTHGUARD] Profile incomplete (WO-13 criteria), redirecting to professional onboarding", {
          uid: user?.uid,
          email: user?.email,
          registrationStatus: profile.registrationStatus,
          firstName,
          hasFirstName,
          professionalTitle: profile.professionalTitle,
          profession: profile.profession,
          hasProfessionalTitle,
          specialty: profile.specialty,
          hasSpecialty,
          practiceCountry,
          country: profile.country,
          hasPracticeCountry,
          pilotConsent: (profile as any).pilotConsent,
          pilotConsentAccepted: (profile as any).pilotConsent?.accepted,
          hasPilotConsent,
          missingFields,
          MISSING_FIELDS: missingFieldsStr
>>>>>>> theirs
        });
        return <Navigate to="/professional-onboarding" replace />;
      }
      // Si profileIsComplete === true, permitir acceso (no redirigir)
    }
    // Si registrationStatus === 'complete', permitir acceso (no redirigir)
  }

  // Usuario autenticado y verificado (si es requerido)
  return <>{children}</>;
};
