// @ts-nocheck
import React from 'react';
import { AlertTriangle, Eye, Pill, Shield, Brain } from 'lucide-react';

interface ClinicalAlertsProps {
  conditions: any[];
  medications: any[];
  symptoms: any[];
}

export const ClinicalAlerts: React.FC<ClinicalAlertsProps> = ({
  conditions,
  medications,
  symptoms
}) => {
  const alerts = [];

  // Análisis de interacciones medicamentosas
  const hasPregabalin = medications.some(m => m.text?.toLowerCase().includes('pregabalin'));
  const hasOpioids = medications.some(m => 
    m.text?.toLowerCase().match(/morfina|oxicodona|tramadol|fentanilo/)
  );
  
  if (hasPregabalin && hasOpioids) {
    alerts.push({
      type: 'medication',
      severity: 'high',
      icon: Pill,
      title: 'Interacción Medicamentosa',
      message: 'Pregabalina + opioides: Mayor riesgo de depresión respiratoria y sedación'
    });
  }

  // Alertas de visión de túnel
  const hasCancer = conditions.some(c => c.text?.toLowerCase().includes('cáncer'));
  const hasMetastasis = conditions.some(c => c.text?.toLowerCase().includes('metástasis'));
  const hasSpinalIssue = symptoms.some(s => 
    s.text?.toLowerCase().match(/columna|dorsal|lumbar/)
  );

  if (hasCancer && hasMetastasis && hasSpinalIssue) {
    alerts.push({
      type: 'clinical',
      severity: 'medium',
      icon: Eye,
      title: 'Considerar Diagnóstico Diferencial',
      message: 'Dolor puede no ser solo musculoesquelético. Evaluar progresión de metástasis vs. efectos del tratamiento vs. dolor mecánico'
    });
  }

  // Alertas legales/consentimiento
  if (hasCancer) {
    alerts.push({
      type: 'legal',
      severity: 'info',
      icon: Shield,
      title: 'Consentimiento Informado Requerido',
      message: 'Paciente oncológico: Documentar consentimiento para ejercicio, riesgos explicados, coordinación con oncología'
    });
  }

  // Alerta cardiovascular
  const hasCardiacSurgery = conditions.some(c => 
    c.text?.toLowerCase().includes('valvular') || 
    c.text?.toLowerCase().includes('cardíaca')
  );
  
  if (hasCardiacSurgery) {
    alerts.push({
      type: 'precaution',
      severity: 'medium',
      icon: AlertTriangle,
      title: 'Precaución Cardiovascular',
      message: 'Monitorear FC, PA y síntomas durante ejercicio. Escala de Borg recomendada'
    });
  }

  // Alerta neurológica
  const hasNeuropathy = conditions.some(c => 
    c.text?.toLowerCase().match(/neuralgia|neuropatía|herpes zóster/)
  );
  
  if (hasNeuropathy) {
    alerts.push({
      type: 'clinical',
      severity: 'info',
      icon: Brain,
      title: 'Consideración Neurológica',
      message: 'Dolor neuropático presente. Considerar técnicas de desensibilización y educación en neurociencia del dolor'
    });
  }

  if (alerts.length === 0) return null;

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-orange-200 bg-orange-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-3 mb-4">
      <h3 className="font-semibold text-gray-900 text-sm uppercase">Alertas Clínicas</h3>
      {alerts.map((alert, index) => {
        const Icon = alert.icon;
        return (
          <div 
            key={index} 
            className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconColor(alert.severity)}`} />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};