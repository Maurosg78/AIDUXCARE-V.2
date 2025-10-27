import React, { useState } from 'react';
import { ClinicalForm } from '../../components/forms/ClinicalForm';
import { AlertBanner } from '../../components/alerts/AlertBanner';

export const ClinicalModule: React.FC = () => {
  const [showAlert, setShowAlert] = useState<'success' | 'error' | null>(null);

  return (
    <div className="p-6">
      {showAlert && <AlertBanner type={showAlert} />}
      <ClinicalForm />
    </div>
  );
};
