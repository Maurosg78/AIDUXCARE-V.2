import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsentTextProvider } from './ConsentTextProvider';

export const ConsentForm: React.FC = () => {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('consent.confirmation'));
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">{t('consent.title')}</h2>
      <ConsentTextProvider variant="phipa" />
      <label className="block mt-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mr-2"
        />
        {t('consent.agree')}
      </label>
      <button
        type="submit"
        disabled={!accepted}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        {t('consent.submit')}
      </button>
    </form>
  );
};
