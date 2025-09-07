import React from 'react';
import { Shield, AlertTriangle, XCircle } from 'lucide-react';

export const LegalAlertsDisplay = ({ issues }) => {
  if (!issues || issues.length === 0) return null;
  
  return (
    <div className="border-2 border-orange-600 bg-orange-50 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-6 h-6 text-orange-700" />
        <h3 className="text-lg font-bold text-orange-900">
          ⚠️ ALERTAS LEGALES Y ÉTICAS - RIESGO DE PÉRDIDA DE LICENCIA
        </h3>
      </div>
      
      <div className="space-y-3">
        {issues.map((issue, idx) => (
          <div key={idx} className="bg-white border border-orange-400 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <span className="inline-block px-2 py-1 bg-orange-700 text-white text-xs font-bold rounded">
                {issue.type}
              </span>
              <XCircle className="w-5 h-5 text-orange-600" />
            </div>
            
            <p className="font-semibold text-orange-900">{issue.text}</p>
            <p className="text-sm text-gray-700 mt-1">{issue.description}</p>
            
            <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded">
              <p className="text-xs font-semibold text-red-900">
                CONSECUENCIA LEGAL:
              </p>
              <p className="text-xs text-red-800">{issue.consequence}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-orange-100 rounded-lg">
        <p className="text-sm font-bold text-orange-900">
          ⚠️ ACCIÓN REQUERIDA: Documentar todo. Consultar supervisor. NO continuar estas prácticas.
        </p>
      </div>
    </div>
  );
};
