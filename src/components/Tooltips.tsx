// @ts-nocheck
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children || <HelpCircle className="w-4 h-4 text-gray-400" />}
      </div>
      {show && (
        <div className="absolute z-10 w-64 p-2 mt-2 text-sm bg-gray-800 text-white rounded-lg shadow-lg">
          {content}
        </div>
      )}
    </div>
  );
};

export const tooltips = {
  redFlag: "Signos de alarma que requieren derivación urgente o evaluación médica inmediata",
  yellowFlag: "Factores psicosociales que pueden influir en la recuperación",
  rom: "Range of Motion - Rango de movimiento articular medido en grados",
  mmt: "Manual Muscle Testing - Evaluación manual de fuerza muscular (0-5)",
  nprs: "Numeric Pain Rating Scale - Escala numérica del dolor (0-10)",
  borg: "Escala de percepción del esfuerzo (6-20 o 0-10)",
  consent: "Documento legal requerido antes de iniciar tratamiento en pacientes de riesgo"
};