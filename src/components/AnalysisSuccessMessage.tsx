import React from 'react';
import { CheckCircle } from 'lucide-react';

interface AnalysisSuccessMessageProps {
  visible: boolean;
  creditsUsed: number;
}

export const AnalysisSuccessMessage: React.FC<AnalysisSuccessMessageProps> = ({ 
  visible, 
  creditsUsed 
}) => {
  if (!visible) return null;
  
  return (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
      <CheckCircle className="w-5 h-5 text-green-600" />
      <span className="text-green-800">
        Análisis completado exitosamente ({creditsUsed} {creditsUsed === 1 ? 'crédito' : 'créditos'} usado{creditsUsed === 1 ? '' : 's'})
      </span>
    </div>
  );
};
