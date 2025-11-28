/**
 * Legal Consent Document Component
 * Displays the legal consent document in plain text format
 * No formatting, no emphasis, scrollable content
 */

import React from 'react';
import { LEGAL_CONSENT_CONTENT } from '@/content/legalConsentContent';

interface LegalConsentDocumentProps {
  patientName: string;
  physiotherapistName: string;
  clinicName: string;
}

export const LegalConsentDocument: React.FC<LegalConsentDocumentProps> = ({
  patientName,
  physiotherapistName,
  clinicName
}) => {
  const documentText = LEGAL_CONSENT_CONTENT.fullDocument(
    patientName,
    physiotherapistName,
    clinicName
  );

  return (
    <div className="w-full">
      <div 
        className="bg-white border border-gray-300 rounded-lg p-6 overflow-y-auto"
        style={{
          maxHeight: '60vh',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#000000'
        }}
      >
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            color: 'inherit',
            margin: 0,
            padding: 0
          }}
        >
          {documentText}
        </pre>
      </div>
    </div>
  );
};

