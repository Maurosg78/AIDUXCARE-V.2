import React from "react";

export const ConsentRequiredBanner: React.FC<{ onGoToConsent: () => void }> = ({ onGoToConsent }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Consentimiento PIPEDA requerido</h2>
      <p className="text-gray-600 mb-4">
        Debes completar el consentimiento informado antes de acceder al flujo clínico.
      </p>
      <button
        onClick={onGoToConsent}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
      >
        Ir al consentimiento
      </button>
    </div>
  </div>
);
