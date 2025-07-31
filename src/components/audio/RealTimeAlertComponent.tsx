/**
 * 🚨 RealTimeAlertComponent - Componente de Alertas en Tiempo Real
 * 
 * Componente React que muestra alertas críticas para prevenir daño al paciente
 * durante técnicas manuales y exploración física.
 * 
 * OBJETIVO: Proporcionar interfaz visual clara y no intrusiva para alertas
 * de seguridad médica en tiempo real.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SafetyAlert, SafetySystemState } from '../../types/clinical';

interface RealTimeAlertComponentProps {
  alerts: SafetyAlert[];
  systemState: SafetySystemState;
  onDismissAlert: (alertId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onStopTechnique: (alertId: string) => void;
  className?: string;
}

/**
 * 🚨 Componente de Alertas en Tiempo Real
 */
export const RealTimeAlertComponent: React.FC<RealTimeAlertComponentProps> = ({
  alerts,
  systemState,
  onDismissAlert,
  onAcknowledgeAlert,
  onStopTechnique,
  className = ''
}) => {
  const [visibleAlerts, setVisibleAlerts] = useState<SafetyAlert[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Filtrar alertas visibles (no descartadas)
  useEffect(() => {
    const activeAlerts = alerts.filter(alert => !alert.isDismissed);
    setVisibleAlerts(activeAlerts);
  }, [alerts]);

  // Auto-minimizar alertas de bajo nivel después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      const lowLevelAlerts = visibleAlerts.filter(alert => alert.urgencyLevel <= 2);
      if (lowLevelAlerts.length > 0) {
        setIsMinimized(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [visibleAlerts]);

  // Auto-expandir si hay alertas críticas
  useEffect(() => {
    const criticalAlerts = visibleAlerts.filter(alert => alert.urgencyLevel >= 4);
    if (criticalAlerts.length > 0) {
      setIsMinimized(false);
    }
  }, [visibleAlerts]);

  const handleDismiss = useCallback((alertId: string) => {
    onDismissAlert(alertId);
  }, [onDismissAlert]);

  const handleAcknowledge = useCallback((alertId: string) => {
    onAcknowledgeAlert(alertId);
  }, [onAcknowledgeAlert]);

  const handleStopTechnique = useCallback((alertId: string) => {
    onStopTechnique(alertId);
  }, [onStopTechnique]);

  const getUrgencyIcon = (urgencyLevel: number): string => {
    switch (urgencyLevel) {
      case 5:
        return '⛔';
      case 4:
        return '🚨';
      case 3:
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getUrgencyText = (urgencyLevel: number): string => {
    switch (urgencyLevel) {
      case 5:
        return 'DETENER INMEDIATAMENTE';
      case 4:
        return 'ALERTA CRÍTICA';
      case 3:
        return 'PRECAUCIÓN';
      default:
        return 'INFORMACIÓN';
    }
  };

  const getAlertCSSClass = (alert: SafetyAlert): string => {
    const baseClass = 'real-time-alert';
    const urgencyClass = `urgency-${alert.urgencyLevel}`;
    const typeClass = `type-${alert.type}`;
    
    return `${baseClass} ${urgencyClass} ${typeClass}`;
  };

  const getAlertStyle = (alert: SafetyAlert): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000 + alert.urgencyLevel,
      maxWidth: '400px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
      animation: alert.urgencyLevel >= 4 ? 'pulse-critical 2s infinite' : 'none'
    };

    // Posicionamiento según urgencia
    if (alert.urgencyLevel >= 4) {
      // Alertas críticas en el centro
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#dc2626',
        color: 'white',
        border: '2px solid #991b1b'
      };
    } else if (alert.urgencyLevel === 3) {
      // Alertas de precaución en la esquina superior derecha
      return {
        ...baseStyle,
        top: '20px',
        right: '20px',
        backgroundColor: '#f59e0b',
        color: 'black',
        border: '1px solid #d97706'
      };
    } else {
      // Alertas informativas en la esquina inferior derecha
      return {
        ...baseStyle,
        bottom: '20px',
        right: '20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: '1px solid #2563eb'
      };
    }
  };

  // Si no hay alertas visibles, no renderizar nada
  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`real-time-alert-system ${className}`}>
      {/* CSS para animaciones */}
      <style>
        {`
          @keyframes pulse-critical {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.05); }
          }
          
          .real-time-alert {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 16px;
            margin: 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
          }
          
          .real-time-alert.urgency-5 {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            border: 2px solid #991b1b;
          }
          
          .real-time-alert.urgency-4 {
            background: linear-gradient(135deg, #ea580c, #c2410c);
            color: white;
            border: 1px solid #9a3412;
          }
          
          .real-time-alert.urgency-3 {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: black;
            border: 1px solid #92400e;
          }
          
          .real-time-alert.urgency-2,
          .real-time-alert.urgency-1 {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            border: 1px solid #1d4ed8;
          }
          
          .alert-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          
          .alert-icon {
            font-size: 24px;
            margin-right: 8px;
          }
          
          .alert-urgency {
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .alert-dismiss {
            background: none;
            border: none;
            color: inherit;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
          }
          
          .alert-dismiss:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }
          
          .alert-message {
            margin-bottom: 12px;
          }
          
          .alert-text {
            font-size: 14px;
            line-height: 1.4;
            margin: 0;
          }
          
          .alert-recommendations {
            margin-top: 8px;
            font-size: 12px;
            opacity: 0.9;
          }
          
          .alert-recommendations ul {
            margin: 4px 0;
            padding-left: 16px;
          }
          
          .alert-recommendations li {
            margin: 2px 0;
          }
          
          .alert-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }
          
          .btn-primary,
          .btn-danger {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .btn-primary {
            background-color: rgba(255, 255, 255, 0.2);
            color: inherit;
          }
          
          .btn-primary:hover {
            background-color: rgba(255, 255, 255, 0.3);
          }
          
          .btn-danger {
            background-color: #dc2626;
            color: white;
          }
          
          .btn-danger:hover {
            background-color: #b91c1c;
          }
          
          .alert-minimized {
            transform: scale(0.8);
            opacity: 0.7;
          }
          
          .alert-minimized:hover {
            transform: scale(1);
            opacity: 1;
          }
        `}
      </style>

      {/* Renderizar alertas visibles */}
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${getAlertCSSClass(alert)} ${isMinimized && alert.urgencyLevel <= 2 ? 'alert-minimized' : ''}`}
          style={getAlertStyle(alert)}
        >
          <div className="alert-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="alert-icon">{getUrgencyIcon(alert.urgencyLevel)}</span>
              <span className="alert-urgency">{getUrgencyText(alert.urgencyLevel)}</span>
            </div>
            <button
              className="alert-dismiss"
              onClick={() => handleDismiss(alert.id)}
              title="Descartar alerta"
            >
              ×
            </button>
          </div>

          <div className="alert-message">
            <p className="alert-text">{alert.message}</p>
            
            {alert.recommendations && alert.recommendations.length > 0 && (
              <div className="alert-recommendations">
                <strong>Recomendaciones:</strong>
                <ul>
                  {alert.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="alert-actions">
            <button
              className="btn-primary"
              onClick={() => handleAcknowledge(alert.id)}
            >
              Entendido
            </button>
            
            {alert.actionRequired === 'STOP_IMMEDIATELY' && (
              <button
                className="btn-danger"
                onClick={() => handleStopTechnique(alert.id)}
              >
                Detener Técnica
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Indicador de estado del sistema */}
      {systemState.isActive && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: systemState.currentRiskLevel === 'danger' ? '#dc2626' :
                           systemState.currentRiskLevel === 'warning' ? '#f59e0b' :
                           systemState.currentRiskLevel === 'caution' ? '#3b82f6' : '#10b981',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            zIndex: 999,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          🚨 Sistema Activo - {systemState.analysisCount} análisis
        </div>
      )}
    </div>
  );
};

export default RealTimeAlertComponent; 