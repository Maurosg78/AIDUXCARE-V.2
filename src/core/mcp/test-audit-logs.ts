import { AuditLogger } from "@/core/audit/AuditLogger";

// Función para crear logs de prueba
export function createTestAuditLogs(): void {
  // Primero limpiar logs existentes
  AuditLogger.clearLogs();

  // ID de visita para pruebas
  const visitId = "visit-audit-test-001";

  // Simular logs para un bloque contextual
  AuditLogger.logBlockUpdates(
    [
      {
        id: "block-ctx-1",
        type: "contextual",
        content: "Contenido original contextual",
        visit_id: visitId,
      },
    ],
    [
      {
        id: "block-ctx-1",
        type: "contextual",
        content: "Contenido modificado contextual para pruebas de auditoría",
        visit_id: visitId,
      },
    ],
    "admin-test-001",
    visitId,
  );

  // Simular logs para un bloque persistente
  AuditLogger.logBlockUpdates(
    [
      {
        id: "block-per-1",
        type: "persistent",
        content: "Contenido original persistente",
        visit_id: visitId,
        patient_id: "patient-456",
      },
    ],
    [
      {
        id: "block-per-1",
        type: "persistent",
        content: "Contenido modificado persistente para pruebas de auditoría",
        visit_id: visitId,
        patient_id: "patient-456",
      },
    ],
    "admin-test-001",
    visitId,
  );

  // Simular logs para un bloque semántico
  AuditLogger.logBlockUpdates(
    [
      {
        id: "block-sem-1",
        type: "semantic",
        content: "Contenido original semántico",
        visit_id: visitId,
      },
    ],
    [
      {
        id: "block-sem-1",
        type: "semantic",
        content: "Contenido modificado semántico para pruebas de auditoría",
        visit_id: visitId,
      },
    ],
    "admin-test-001",
    visitId,
  );

  // También crear un log para otra visita (para probar el filtrado)
  AuditLogger.logBlockUpdates(
    [
      {
        id: "block-other-1",
        type: "contextual",
        content: "Contenido original de otra visita",
        visit_id: "visit-different-001",
      },
    ],
    [
      {
        id: "block-other-1",
        type: "contextual",
        content: "Contenido modificado de otra visita",
        visit_id: "visit-different-001",
      },
    ],
    "admin-test-001",
    "visit-different-001",
  );

  // Simular integración de sugerencias
  AuditLogger.logSuggestionIntegration(
    "admin-test-001",
    visitId,
    "suggestion-001",
    "recommendation",
    "Realizar control de presión arterial cada 4 horas",
    "plan",
  );

  AuditLogger.logSuggestionIntegration(
    "admin-test-001",
    visitId,
    "suggestion-002",
    "warning",
    "Paciente con alergia documentada a penicilina",
    "assessment",
  );

  AuditLogger.logSuggestionIntegration(
    "admin-test-001",
    "visit-different-001",
    "suggestion-003",
    "info",
    "Paciente con historia de HTA controlada",
    "notes",
  );

  // Verificar que se han creado los logs
  console.log(
    `✅ Logs de auditoría generados:`,
    AuditLogger.getAuditLogs().length,
  );
}
