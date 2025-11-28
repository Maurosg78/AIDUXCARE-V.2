import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmailTemplateProps {
  subjectKey: string;
  bodyKey: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({ subjectKey, bodyKey }) => {
  const { t } = useTranslation();

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '1rem', background: '#f8f8f8' }}>
      <h2>{t(`emails.${subjectKey}`)}</h2>
      <p>{t(`emails.${bodyKey}`)}</p>
    </div>
  );
};
