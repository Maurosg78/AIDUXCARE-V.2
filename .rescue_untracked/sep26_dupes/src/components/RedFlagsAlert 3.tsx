import React, { useState } from 'react';
import { AlertTriangle, Phone, AlertCircle, X } from 'lucide-react';

import { Card } from '../shared/ui';
import type { RedFlag } from '../types/vertex-ai';

interface RedFlagsAlertProps {
  redFlags: RedFlag[];
}

export const RedFlagsAlert: React.FC<RedFlagsAlertProps> = ({ redFlags }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!redFlags || redFlags.length === 0 || isDismissed) {
    return null;
  }

  const isEmergency = redFlags.some(f => f.urgency === 'urgent');

  return (
    <Card className={`p-4 mb-4 border-2 ${isEmergency ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {isEmergency ? (
            <Phone className="w-6 h-6 text-red-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg mb-2 text-red-700">
              ⚠️ RED FLAGS DETECTADOS - ACCIÓN REQUERIDA
            </h3>
            <button
              onClick={() => {
                if (window.confirm('¿Está seguro de descartar esta alerta? Se documentará su decisión.')) {
                  console.log('Red flag descartado por el profesional:', new Date().toISOString());
                  setIsDismissed(true);
                }
              }}
              className="text-gray-500 hover:text-gray-700"
              title="Descartar alerta (se documentará)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {redFlags.map((flag, index) => (
            <div key={index} className="mb-3 p-3 bg-white rounded border-l-4 border-red-500">
              <div className="font-semibold text-red-800">{flag.pattern}</div>
              <div className="text-sm mt-1">{flag.action}</div>
            </div>
          ))}

          {isEmergency && (
            <div className="mt-4 p-3 bg-red-100 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-700" />
                <span className="font-medium text-red-800">
                  Documentar derivación inmediata y hora: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-600 mt-3">
            * El profesional es responsable de la decisión clínica final
          </div>
        </div>
      </div>
    </Card>
  );
};
