import React from 'react';
import { Info } from 'lucide-react';

import { Card } from '../shared/ui';

export const TranscriptionLabels = () => {
  return (
    <div className="mb-2 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">¿Qué incluir en la consulta?</p>
          <ul className="space-y-1 text-xs">
            <li>• Motivo de consulta y duración de síntomas</li>
            <li>• Antecedentes médicos relevantes</li>
            <li>• Medicación actual con dosis</li>
            <li>• Limitaciones funcionales específicas</li>
            <li>• Objetivos del paciente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const placeholderText = `Ejemplo: Paciente de 45 años, oficinista, consulta por dolor lumbar de 3 semanas de evolución. Comenzó tras levantar peso en el trabajo. Dolor 7/10, mejora con reposo, empeora al estar sentado. Sin irradiación a miembros inferiores. Toma ibuprofeno 600mg cada 8 horas con alivio parcial. Antecedentes: HTA controlada con enalapril 10mg. Objetivo: volver a trabajar sin dolor.`;
