import React from 'react';
import { Navigate } from 'react-router-dom';

// Placeholder para un futuro hook de autenticación real
const useAuth = () => {
  // Para pruebas, simulamos que el usuario está logueado.
  // En el futuro, esto verificará un token JWT, una cookie, etc.
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  return { isAuthenticated };
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Si no está autenticado, redirige a la página de login
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
