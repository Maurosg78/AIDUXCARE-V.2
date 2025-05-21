import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../core/auth/UserContext';
import { RoleType } from '../../core/services/userDataSourceSupabase';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: RoleType | RoleType[];
}

/**
 * Componente para proteger rutas basadas en autenticación y roles
 * 
 * @param children - Componente hijo que se renderizará si el usuario está autenticado y tiene los roles requeridos
 * @param requiredRoles - Rol(es) requerido(s) para acceder a la ruta. Si no se especifica, solo se requiere autenticación.
 */
const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, loading, hasRole, role } = useUser();
  const location = useLocation();

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-boneWhite">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-softCoral"></div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se requieren roles específicos y el usuario no los tiene, redirigir a página de acceso denegado
  if (requiredRoles && !hasRole(requiredRoles as any)) {
    console.warn(`Acceso denegado: Usuario con rol ${role} intentó acceder a ruta que requiere ${requiredRoles}`);
    return <Navigate to="/access-denied" replace />;
  }

  // Si el usuario está autenticado y tiene los roles necesarios, renderizar los hijos
  return <>{children}</>;
};

export default ProtectedRoute; 