// @ts-nocheck
/**
 * 🏛️ Legal Consent Admin Page - AiDuxCare V.2
 * Página de administración para gestión del consentimiento legal
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState, useEffect } from 'react';

import { LegalConsentStatus } from '../components/LegalConsentStatus';
import { legalConsentService, type LegalConsent, type ConsentAuditLog } from '../services/legalConsentService';

import logger from '@/shared/utils/logger';

interface ConsentData {
  consent: LegalConsent | null;
  auditLog: ConsentAuditLog[];
  report: {
    hasValidConsent: boolean;
    consentDate: Date | null;
    lastUpdated: Date | null;
    auditEntries: number;
  };
}

export const LegalConsentAdminPage: React.FC = () => {
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadConsentData();
  }, []);

  const loadConsentData = () => {
    try {
      const data = legalConsentService.exportConsentData();
      setConsentData(data);
    } catch (error) {
      logger.error('Error al cargar datos de consentimiento:', error);
    }
  };

  const handleExportData = () => {
    try {
      const data = legalConsentService.exportConsentData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consentimiento_legal_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error al exportar datos:', error);
      alert('Error al exportar los datos');
    }
  };

  const handleClearData = () => {
    if (confirm('¿Está seguro de que desea eliminar todos los datos de consentimiento? Esta acción no se puede deshacer.')) {
      try {
        localStorage.removeItem('aiduxcare_legal_consent');
        localStorage.removeItem('aiduxcare_consent_audit');
        loadConsentData();
        alert('Datos de consentimiento eliminados');
      } catch (error) {
        logger.error('Error al eliminar datos:', error);
        alert('Error al eliminar los datos');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administración de Consentimiento Legal
          </h1>
          <p className="text-gray-600">
            Gestión y auditoría del consentimiento legal de AiDuxCare
          </p>
        </div>

        {/* Estado del Consentimiento */}
        <div className="mb-8">
          <LegalConsentStatus 
            showDetails={showDetails}
            onConsentChange={(hasConsent) => {
              logger.info('Estado de consentimiento cambiado:', hasConsent);
              loadConsentData();
            }}
          />
        </div>

        {/* Controles de Administración */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Controles de Administración
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
            </button>
            
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Exportar Datos
            </button>
            
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Limpiar Datos
            </button>
          </div>
        </div>

        {/* Reporte de Compliance */}
        {consentData && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reporte de Compliance
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Resumen</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consentimiento Válido:</span>
                    <span className={consentData.report.hasValidConsent ? 'text-green-600' : 'text-red-600'}>
                      {consentData.report.hasValidConsent ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de Consentimiento:</span>
                    <span className="text-gray-900">
                      {consentData.report.consentDate ? 
                        new Date(consentData.report.consentDate).toLocaleDateString('es-ES') : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entradas de Auditoría:</span>
                    <span className="text-gray-900">{consentData.report.auditEntries}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Auditoría</h3>
                <div className="max-h-40 overflow-y-auto">
                  {consentData.auditLog.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {consentData.auditLog.slice(-5).map((entry: ConsentAuditLog) => (
                        <div key={entry.id} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">{entry.action}</span>
                            <span className="text-gray-500">
                              {new Date(entry.timestamp).toLocaleString('es-ES')}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {entry.consentType} - {entry.userId}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay entradas de auditoría</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información Legal */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Información Legal Importante
          </h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Compliance:</strong> Este sistema cumple con las regulaciones HIPAA y GDPR 
              para el manejo seguro de consentimientos médicos.
            </p>
            <p>
              <strong>Auditoría:</strong> Todas las acciones de consentimiento son registradas 
              para cumplimiento regulatorio y auditorías.
            </p>
            <p>
              <strong>Retención:</strong> Los datos de consentimiento se mantienen según las 
              políticas de retención médica aplicables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 