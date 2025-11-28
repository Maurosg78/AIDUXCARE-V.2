import React from 'react';
import { ArrowRight, CheckCircle, Circle } from 'lucide-react';

interface WorkflowGuideProps {
  currentStep: number;
}

export const WorkflowGuide: React.FC<WorkflowGuideProps> = ({ currentStep }) => {
  const steps = [
    { 
      id: 1, 
      title: t("workflow.initialAnalysis"),
      description: "Capturar y analizar información del paciente",
      example: "Historia clínica, síntomas, medicación"
    },
    { 
      id: 2, 
      title: t("workflow.physicalEvaluation"),
      description: "Realizar tests seleccionados",
      example: "ROM, fuerza, tests especiales"
    },
    { 
      id: 3, 
      title: t("workflow.soapReport"),
      description: "Generar documentación clínica",
      example: "Subjetivo, Objetivo, Análisis, Plan"
    }
  ];

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : currentStep === step.id ? (
                  <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <span className={`font-medium text-sm ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 ml-7">{step.description}</p>
              <p className="text-xs text-gray-400 ml-7 italic">Ej: {step.example}</p>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
