import { RouterProvider } from 'react-router-dom';
import { useMemo } from 'react';

import { createRouter } from './router/router';

export default function App() {
  // Crear el router dentro del componente para asegurar que los providers estén disponibles
  const router = useMemo(() => createRouter(), []);

  return <RouterProvider router={router} />;
}
