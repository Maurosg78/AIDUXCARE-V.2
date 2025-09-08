import React from 'react';
import { getLanguage, setLanguage, t } from '@/utils/translations';

export const LanguageSelector: React.FC = () => {
  const lang = getLanguage();
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <button
        type="button"
        onClick={() => setLanguage('en', { reload: false })}
        aria-pressed={lang === 'en'}
        title="English"
        style={{
          border: lang === 'en' ? '2px solid #444' : '1px solid #ccc',
          borderRadius: 8, padding: '4px 8px', background: 'white', cursor: 'pointer'
        }}
      >🇨🇦 EN</button>
      <button
        type="button"
        onClick={() => setLanguage('es', { reload: false })}
        aria-pressed={lang === 'es'}
        title="Español (España)"
        style={{
          border: lang === 'es' ? '2px solid #444' : '1px solid #ccc',
          borderRadius: 8, padding: '4px 8px', background: 'white', cursor: 'pointer'
        }}
      >🇪🇸 ES</button>
    </div>
  );
};

export default LanguageSelector;
