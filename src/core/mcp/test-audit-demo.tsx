import React, { useEffect } from 'react';
import AuditLogViewer from '@/shared/components/Audit/AuditLogViewer';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { createTestAuditLogs } from './test-audit-logs';

/**
 * Componente de demostración para probar AuditLogViewer
 * con datos simulados en diferentes escenarios.
 */
const AuditLogDemo: React.FC = () => {
  useEffect(() => {
    // Generar logs de prueba al montar el componente
    createTestAuditLogs();
  }, []);

  // ID de visita para pruebas
  const testVisitId = "visit-audit-test-001";
  // ID de otra visita (no debería mostrar logs)
  const otherVisitId = "visit-non-existent";
  
  // Obtener todos los logs
  const allLogs = AuditLogger.getAuditLogs();
  
  // Contar logs para cada visita
  const testVisitLogCount = allLogs.filter(log => 
    (log.details && log.details.visit_id === testVisitId) || 
    ('visit_id' in log && log.visit_id === testVisitId)
  ).length;
  
  const otherVisitLogCount = allLogs.filter(log => 
    (log.details && log.details.visit_id === otherVisitId) || 
    ('visit_id' in log && log.visit_id === otherVisitId)
  ).length;
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Demo de Auditoría</h1>
      
      <div className="mb-10 p-4 bg-gray-50 rounded border">
        <h2 className="text-lg font-semibold mb-2">Información de prueba:</h2>
        <ul className="list-disc pl-5 mb-4">
          <li>Total de logs generados: {allLogs.length}</li>
          <li>Logs para visita <code>{testVisitId}</code>: {testVisitLogCount}</li>
          <li>Logs para visita <code>{otherVisitId}</code>: {otherVisitLogCount}</li>
        </ul>
      </div>
      
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Caso 1: Visita con logs</h2>
        <div className="border p-4 rounded">
          <h3 className="text-lg mb-4">Vista de detalle para visita: {testVisitId}</h3>
          <AuditLogViewer 
            visitId={testVisitId}
            logs={allLogs}
          />
        </div>
      </section>
      
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Caso 2: Visita sin logs</h2>
        <div className="border p-4 rounded">
          <h3 className="text-lg mb-4">Vista de detalle para visita: {otherVisitId}</h3>
          <div className="text-sm italic text-gray-500 mb-4">
            Nota: No debería mostrarse ningún panel de auditoría
          </div>
          <AuditLogViewer 
            visitId={otherVisitId}
            logs={allLogs}
          />
          <div className="mt-4 p-2 bg-gray-100 rounded">
            {/* Este div siempre se mostrará, para confirmar que el componente se renderizó */}
            <p className="text-sm">Esta es otra parte de la página que siempre debe mostrarse.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuditLogDemo; 