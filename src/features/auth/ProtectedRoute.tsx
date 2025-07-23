import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../core/auth/UserContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRoles?: string | string[];
};

/**
 * Componente para proteger rutas basadas en autenticación y roles
 * 
 * @param children - Componente hijo que se renderizará si el usuario está autenticado y tiene los roles requeridos
 * @param requiredRoles - Rol(es) requerido(s) para acceder a la ruta. Si no se especifica, solo se requiere autenticación.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles 
}) => {
  const { user, isLoading } = useUser();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Si no estamos cargando y tenemos usuario, comprobamos roles
    if (!isLoading && user) {
      // Si no se requiere rol específico, simplemente autorizamos
      if (!requiredRoles) {
        setIsAuthorized(true);
        return;
      }

      // Convertimos a array para facilitar la comprobación
      const requiredRolesArray = typeof requiredRoles === 'string' 
        ? [requiredRoles] 
        : requiredRoles;

      // Para simplificar, asumimos que el rol del usuario está en user.role
      // En una implementación real, esto podría ser más complejo
      const userRole = user?.role as string || 'visitor';
      
      // Verificamos si el usuario tiene alguno de los roles requeridos
      const hasRequiredRole = requiredRolesArray.includes(userRole);
      setIsAuthorized(hasRequiredRole);
    } else if (!isLoading) {
      // Si no estamos cargando y no hay usuario, no está autorizado
      setIsAuthorized(false);
    }
  }, [user, isLoading, requiredRoles]);

  // Mientras estamos comprobando, mostramos un indicador de carga o nada
  if (isLoading || isAuthorized === null) {
    return <div className="p-4 text-center">Comprobando permisos...</div>;
  }

  // Si no está autorizado, redirigimos
  if (!isAuthorized) {
    // Para desarrollo, permitimos cualquier ruta para facilitar pruebas
    if (import.meta.env.DEV) {
      console.warn('DEV MODE: Permitiendo acceso aunque no está autorizado');
      return <>{children}</>;
    }
    
    return user 
      ? <Navigate to="/access-denied" replace /> 
      : <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no ha verificado su email, redirigir a /verify-email
  if (user && user.emailVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }

  // Si está autorizado, mostramos los hijos
  return <>{children}</>;
};

export default ProtectedRoute; 