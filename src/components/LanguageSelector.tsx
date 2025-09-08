import React from 'react';

export const LanguageSelector: React.FC = () => {
  const [language, setLanguage] = React.useState(
    localStorage.getItem('preferredLanguage') || 'es'
  );

  const handleChange = (lang: string) => {
    localStorage.setItem('preferredLanguage', lang);
    setLanguage(lang);
    window.location.reload();
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-1">
      <button
        onClick={() => handleChange('en')}
        className={`px-2 py-1 text-sm rounded ${
          language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        🇨🇦 EN
      </button>
      <button
        onClick={() => handleChange('es')}
        className={`px-2 py-1 text-sm rounded ${
          language === 'es' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        🇪🇸 ES
      </button>
    </div>
  );
};
