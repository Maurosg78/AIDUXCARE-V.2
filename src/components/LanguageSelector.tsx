import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(localStorage.getItem('i18nextLng') || i18n.language || 'en');

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  }, [lang, i18n]);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="lang" className="text-sm font-medium text-gray-600">
        🌐
      </label>
      <select
        id="lang"
        className="border rounded-md p-1 text-sm"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
};
