import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * True si el usuario tiene el custom claim `admin` (para leer user_feedback, etc.).
 * Requiere que el usuario haya cerrado sesión y vuelto a entrar tras set-admin-claim.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    user
      .getIdTokenResult()
      .then((result) => setIsAdmin(!!(result.claims as Record<string, unknown>)?.admin))
      .catch(() => setIsAdmin(false));
  }, [user]);

  return isAdmin;
}
