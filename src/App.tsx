import { RouterProvider } from 'react-router-dom';
import { useMemo } from 'react';

import { createRouter } from './router/router';
import { FeedbackWidget } from './components/feedback/FeedbackWidget';

export default function App() {
  // Crear el router dentro del componente para asegurar que los providers estén disponibles
  const router = useMemo(() => createRouter(), []);

  return (
    <>
      <RouterProvider router={router} />
      {/* Global pilot feedback button - visible on all pages */}
      <FeedbackWidget />
    </>
  );
}
