import React from 'react';
import { AlertTriangle, Shield, Pill, Brain, FileWarning } from 'lucide-react';
import { Card } from '../shared/ui';

interface SegregatedAlertsProps {
  medicalAlerts: any;
  legalAlerts: unknown[];
  drugInteractions: unknown[];
}

export const SegregatedAlerts: React.FC<SegregatedAlertsProps> = ({
  medicalAlerts,
  legalAlerts,
  drugInteractions
}) => {
  const hasCriticalAlerts = medicalAlerts?.criticas?.length > 0;
  const hasLegalAlerts = legalAlerts?.length > 0;
  const hasDrugInteractions = drugInteractions?.length > 0;

  if (!hasCriticalAlerts && !hasLegalAlerts && !hasDrugInteractions) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      {/* ALERTAS MÉDICAS CRÍTICAS */}
      {hasCriticalAlerts && (
        <Card className="border-2 border-red-500 bg-red-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-red-900 text-lg">
                ⚠️ ALERTAS MÉDICAS CRÍTICAS - Acción Inmediata Requerida
              </h3>
            </div>
            <div className="space-y-3">
              {medicalAlerts.criticas.map((alert, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-red-300">
                  <p className="font-semibold text-red-900">{alert.hallazgo}</p>
                  <p className="text-sm text-red-700 mt-1">
                    <span className="font-medium">Acción: </span>{alert.accion_requerida}
                  </p>
                  <p className="text-xs text-red-600 mt-1 italic">
                    Justificación: {alert.justificacion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ALERTAS LEGALES/ÉTICAS */}
      {hasLegalAlerts && (
        <Card className="border-2 border-orange-500 bg-orange-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-6 h-6 text-orange-600" />
              <h3 className="font-bold text-orange-900 text-lg">
                🚨 ALERTAS LEGALES Y ÉTICAS
              </h3>
            </div>
            <div className="space-y-3">
              {legalAlerts.map((alert, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-orange-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-bold bg-orange-600 text-white rounded">
                        {alert.tipo}
                      </span>
                      <p className="text-sm text-orange-900 mt-2">{alert.descripcion}</p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700 mt-2">
                    <span className="font-medium">Consecuencia potencial: </span>
                    {alert.consecuencia}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* INTERACCIONES FARMACOLÓGICAS */}
      {hasDrugInteractions && (
        <Card className="border-2 border-purple-500 bg-purple-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-6 h-6 text-purple-600" />
              <h3 className="font-bold text-purple-900 text-lg">
                💊 INTERACCIONES FARMACOLÓGICAS PELIGROSAS
              </h3>
            </div>
            <div className="space-y-3">
              {drugInteractions.map((interaction, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-purple-300">
                  <p className="font-medium text-purple-900">
                    {interaction.medicamentos.join(' + ')}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    <span className="font-medium">Riesgo: </span>{interaction.riesgo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
