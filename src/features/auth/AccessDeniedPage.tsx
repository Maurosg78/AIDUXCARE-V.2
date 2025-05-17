import { vi } from "vitest";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../core/auth/UserContext';

/**
 * Página que se muestra cuando un usuario intenta acceder a una sección para la que no tiene permisos
 */
const AccessDeniedPage = () => {
  const { role, logout } = useUser();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-boneWhite px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-extrabold text-softCoral">403</h1>
          <h2 className="mt-6 text-3xl font-bold text-slateBlue">
            Acceso Denegado
          </h2>
          <p className="mt-2 text-sm text-slateBlue/70">
            No tienes permisos para acceder a esta sección.
            {role && <span className="block mt-1">Tu rol actual es: <strong>{role}</strong></span>}
          </p>
        </div>
        
        <div className="mt-8">
          <img 
            src="/assets/access-denied.svg" 
            alt="Acceso denegado" 
            className="mx-auto h-40" 
            onError={(e) => {
              // Si la imagen no se encuentra, ocultarla
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleGoHome}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slateBlue hover:bg-slateBlue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slateBlue"
          >
            Volver al inicio
          </button>
          
          <button
            onClick={logout}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-slateBlue bg-white border-slateBlue hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slateBlue"
          >
            Cerrar sesión
          </button>
        </div>
        
        <div className="mt-6">
          <p className="text-xs text-slateBlue/60">
            Si crees que deberías tener acceso a esta sección, por favor contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage; 