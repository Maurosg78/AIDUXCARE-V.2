import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { localAuthService } from "./services/LocalAuthService";
import { router } from "./router";
import "./App.css";

// FUNCIÓN GLOBAL PARA UAT: Forzar rol OWNER desde consola
declare global {
  interface Window {
    forceOwnerRole: () => void;
    checkUserRole: () => void;
  }
}

function App() {
  // Exponer funciones de UAT en window para acceso desde consola
  React.useEffect(() => {
    window.forceOwnerRole = () => {
      const result = localAuthService.forceOwnerRole();
      if (result) {
        console.log('UAT: Rol OWNER asignado exitosamente');
        console.log('Recarga la página para aplicar cambios');
      } else {
        console.log('Error: No hay usuario logueado');
      }
    };

    window.checkUserRole = () => {
      const user = localAuthService.getCurrentTherapist();
      if (user) {
        console.log('Usuario actual:', user.name);
        console.log('Rol:', user.role || 'No asignado');
        console.log('Es OWNER:', localAuthService.isOwner());
        console.log('Acceso ilimitado:', localAuthService.hasUnlimitedAccess());
      } else {
        console.log('No hay usuario logueado');
      }
    };

    // Mensaje de bienvenida UAT
    console.log('AiDuxCare V.2 - Modo UAT Activado');
    console.log('Comandos disponibles:');
    console.log('  window.forceOwnerRole() - Asignar rol OWNER');
    console.log('  window.checkUserRole() - Verificar rol actual');
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;