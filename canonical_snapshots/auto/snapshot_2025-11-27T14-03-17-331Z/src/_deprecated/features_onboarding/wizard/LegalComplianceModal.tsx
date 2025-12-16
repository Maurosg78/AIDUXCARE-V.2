// @ts-nocheck
import React from 'react';
import { LegalCompliance } from '../../services/geolocationService';

interface LegalComplianceModalProps {
  isOpen: boolean;
  compliance: LegalCompliance;
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  compliance,
  onClose
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-yellow-700 mb-2">Advertencia Legal - {compliance.country}</h2>
        <p className="text-gray-800 mb-4">
          Para ejercer profesionalmente en {compliance.country}, debes cumplir con los siguientes requisitos legales y de protección de datos:
        </p>
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-1"><strong>Leyes aplicables:</strong> {compliance.localPrivacyLaws.join(', ')}</p>
          <p className="text-sm text-gray-700 mb-1"><strong>Retención de datos:</strong> {compliance.dataRetention} días</p>
          {compliance.specialRequirements.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-700 font-semibold mb-1">Requisitos especiales:</p>
              <ul className="list-disc list-inside ml-4">
                {compliance.specialRequirements.map((req, idx) => (
                  <li key={idx} className="text-sm text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors mt-2"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};