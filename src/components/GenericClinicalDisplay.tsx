// @ts-nocheck
import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export const GenericClinicalDisplay = ({ data }) => {
  if (!data) return null;
  
  // Agrupar por severidad, no por tipo
  const criticalItems = [
    ...data.risk_indicators?.filter(r => r.severity === 'critical') || [],
    ...data.compliance_issues?.filter(c => c.severity === 'critical') || []
  ];
  
  const highItems = [
    ...data.risk_indicators?.filter(r => r.severity === 'high') || [],
    ...data.compliance_issues?.filter(c => c.severity === 'high') || []
  ];
  
  // Renderizar adaptivamente según lo que se encuentra
  return (
    <div className="space-y-4">
      {/* Solo mostrar alertas críticas si existen */}
      {criticalItems.length > 0 && (
        <div className="border-2 border-red-500 bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="font-bold text-red-900">Alertas Críticas</h3>
          </div>
          {criticalItems.map((item, idx) => (
            <div key={idx} className="mb-2 p-2 bg-white rounded">
              <p className="text-sm">{item.description || item.issue}</p>
              {item.recommended_action && (
                <p className="text-xs text-red-700 mt-1">
                  Acción: {item.recommended_action}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Mostrar otros hallazgos agrupados por severidad */}
      {highItems.length > 0 && (
        <div className="border border-orange-400 bg-orange-50 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-2">Atención Requerida</h3>
          {/* Contenido dinámico */}
        </div>
      )}
      
      {/* Hallazgos clínicos normales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Se adapta al contenido disponible */}
      </div>
    </div>
  );
};