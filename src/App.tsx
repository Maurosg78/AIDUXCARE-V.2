import { RouterProvider } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { createRouter } from './router/router';
import { FeedbackWidget } from './components/feedback/FeedbackWidget';

function DocumentTitleSync() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = t('shell.app.documentTitle');
  }, [t, i18n.language]);
  return null;
}

export default function App() {
  // Crear el router dentro del componente para asegurar que los providers estén disponibles
  const router = useMemo(() => createRouter(), []);

  return (
    <>
      <DocumentTitleSync />
      <RouterProvider router={router} />
      {/* Global pilot feedback button - visible on all pages */}
      <FeedbackWidget />
    </>
  );
}
