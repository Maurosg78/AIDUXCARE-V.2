import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogger } from "@/core/mcp/AuditLogger";

describe("AuditLogger", () => {
  // Limpiar los logs antes de cada test
  beforeEach(() => {
    AuditLogger.clearAuditLogs();
  });

  it("debería registrar cambios en el contenido de los bloques", () => {
    // Bloques originales
    const originalBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido original 1",
        visit_id: "visit-123",
      },
      {
        id: "block-2",
        type: "persistent",
        content: "Contenido original 2",
        patient_id: "patient-456",
        visit_id: "visit-123",
      },
    ];

    // Bloques actualizados (con cambios en el contenido)
    const updatedBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido modificado 1",
        visit_id: "visit-123",
      },
      {
        id: "block-2",
        type: "persistent",
        content: "Contenido modificado 2",
        patient_id: "patient-456",
        visit_id: "visit-123",
      },
    ];

    // Registrar los cambios
    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      "admin-test-001",
      "visit-123",
    );

    // Verificar que se registraron los logs correctamente
    const logs = AuditLogger.getAuditLogs();
    expect(logs.length).toBe(2);

    // Verificar el primer log
    expect(logs[0].block_id).toBe("block-1");
    expect(logs[0].block_type).toBe("contextual");
    expect(logs[0].operation).toBe("update");
    expect(logs[0].old_content).toBe("Contenido original 1");
    expect(logs[0].new_content).toBe("Contenido modificado 1");
    expect(logs[0].user_id).toBe("admin-test-001");
    expect(logs[0].visit_id).toBe("visit-123");
    expect(logs[0].timestamp).toBeDefined();

    // Verificar el segundo log
    expect(logs[1].block_id).toBe("block-2");
    expect(logs[1].block_type).toBe("persistent");
    expect(logs[1].operation).toBe("update");
    expect(logs[1].old_content).toBe("Contenido original 2");
    expect(logs[1].new_content).toBe("Contenido modificado 2");
    expect(logs[1].user_id).toBe("admin-test-001");
    expect(logs[1].visit_id).toBe("visit-123");
    expect(logs[1].timestamp).toBeDefined();
  });

  it("no debería registrar bloques si el contenido no ha cambiado", () => {
    // Bloques originales
    const originalBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido sin cambios",
        visit_id: "visit-123",
      },
    ];

    // Bloques actualizados (sin cambios en el contenido)
    const updatedBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido sin cambios",
        visit_id: "visit-123",
      },
    ];

    // Registrar los cambios
    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      "admin-test-001",
      "visit-123",
    );

    // Verificar que no se registraron logs
    const logs = AuditLogger.getAuditLogs();
    expect(logs.length).toBe(0);
  });

  it("debería ignorar bloques sin ID", () => {
    // Bloques originales
    const originalBlocks = [
      {
        id: "", // ID vacío
        type: "contextual",
        content: "Contenido original",
        visit_id: "visit-123",
      },
    ];

    // Bloques actualizados
    const updatedBlocks = [
      {
        id: "", // ID vacío
        type: "contextual",
        content: "Contenido modificado",
        visit_id: "visit-123",
      },
    ];

    // Registrar los cambios
    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      "admin-test-001",
      "visit-123",
    );

    // Verificar que no se registraron logs
    const logs = AuditLogger.getAuditLogs();
    expect(logs.length).toBe(0);
  });

  it("debería ignorar bloques que no existen en el original", () => {
    // Bloques originales
    const originalBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido original",
        visit_id: "visit-123",
      },
    ];

    // Bloques actualizados (con un bloque adicional)
    const updatedBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido modificado",
        visit_id: "visit-123",
      },
      {
        id: "block-2", // Este bloque no existe en el original
        type: "contextual",
        content: "Contenido nuevo",
        visit_id: "visit-123",
      },
    ];

    // Registrar los cambios
    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      "admin-test-001",
      "visit-123",
    );

    // Verificar que solo se registró el log del bloque que existía en el original
    const logs = AuditLogger.getAuditLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].block_id).toBe("block-1");
  });

  it("debería limpiar los logs cuando se llama a clearAuditLogs", () => {
    // Crear algunos logs
    const originalBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido original",
        visit_id: "visit-123",
      },
    ];

    const updatedBlocks = [
      {
        id: "block-1",
        type: "contextual",
        content: "Contenido modificado",
        visit_id: "visit-123",
      },
    ];

    AuditLogger.logBlockUpdates(
      originalBlocks,
      updatedBlocks,
      "admin-test-001",
      "visit-123",
    );

    // Verificar que hay logs
    expect(AuditLogger.getAuditLogs().length).toBe(1);

    // Limpiar los logs
    AuditLogger.clearAuditLogs();

    // Verificar que se limpiaron los logs
    expect(AuditLogger.getAuditLogs().length).toBe(0);
  });
});
