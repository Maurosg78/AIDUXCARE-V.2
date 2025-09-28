// @ts-nocheck
/**
 * Hook para usar el contexto de autenticación
 * Re-exporta useAuth desde AuthContext para mantener compatibilidad
 */
export { useAuth } from '../context/AuthContext';
export type { AuthContextType, RegisterData } from '../context/AuthContext';