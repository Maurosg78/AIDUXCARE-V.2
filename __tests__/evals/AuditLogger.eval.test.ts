import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogger } from "../../src/core/mcp/AuditLogger";
import { validMCP } from "../../__mocks__/contexts/validMCP";
import { emptyMCP } from "../../__mocks__/contexts/emptyMCP";
import { partialMCP } from "../../__mocks__/contexts/partialMCP";

/**
 * EVALUACIÓN DEL AUDITLOGGER
 *
 * Esta suite evalúa el comportamiento del AuditLogger en diversos escenarios:
 * 1. Registrar actualizaciones de bloques válidos → debe crear entradas de log correctas
 * 2. Registrar actualizaciones con datos vacíos → debe manejar el caso sin errores
 * 3. Registrar actualizaciones con datos parciales → debe filtrar y registrar solo cambios reales
 * 4. Gestión de la persistencia de logs → debe almacenar y permitir recuperar los logs
 */
describe("AuditLogger EVAL", () => {
  // Limpiar los logs antes de cada prueba
  beforeEach(() => {
    AuditLogger.clearAuditLogs();
  });

  /**
   * CASO 1: Registrar actualizaciones de bloques válidos
   *
   * El logger debe crear entradas de log correctas cuando hay cambios
   * entre bloques originales y actualizados
   */
  describe("Caso 1: Registro de actualizaciones válidas", () => {
    it("debe registrar correctamente las actualizaciones de bloques", () => {
      // Preparar datos de prueba
      const originalBlocks = validMCP.contextual.data.map((block) => ({
        ...block,
      }));
      const updatedBlocks = originalBlocks.map((block) => {
        if (block.id === "ctx-1") {
          return { ...block, content: block.content + " [ACTUALIZADO]" };
        }
        return { ...block };
      });

      // Registrar la actualización
      AuditLogger.logBlockUpdates(
        originalBlocks,
        updatedBlocks,
        "test-user-001",
        "visit-20230501-01",
      );

      // Verificar los logs
      const logs = AuditLogger.getAuditLogs();

      // Comprobar que se ha registrado solo un cambio
      expect(logs.length).toBe(1);

      // Verificar la estructura y contenido del log
      const logEntry = logs[0];
      expect(logEntry.block_id).toBe("ctx-1");
      expect(logEntry.operation).toBe("update");
      expect(logEntry.user_id).toBe("test-user-001");
      expect(logEntry.visit_id).toBe("visit-20230501-01");
      expect(logEntry.old_content).toBe(
        originalBlocks.find((b) => b.id === "ctx-1")?.content,
      );
      expect(logEntry.new_content).toBe(
        updatedBlocks.find((b) => b.id === "ctx-1")?.content,
      );
      expect(logEntry.block_type).toBe("contextual");
      expect(logEntry.timestamp).toBeDefined();
    });
  });

  /**
   * CASO 2: Registrar actualizaciones con datos vacíos
   *
   * El logger debe manejar correctamente el caso de datos vacíos,
   * evitando errores y no creando logs innecesarios
   */
  describe("Caso 2: Registro con datos vacíos", () => {
    it("debe manejar correctamente arrays de bloques vacíos", () => {
      // Usar arrays vacíos
      AuditLogger.logBlockUpdates([], [], "test-user-001", "visit-empty");

      // Verificar que no se crearon logs
      const logs = AuditLogger.getAuditLogs();
      expect(logs.length).toBe(0);
    });

    it("debe manejar correctamente el caso donde solo hay bloques originales", () => {
      // Solo hay bloques originales, sin actualizaciones
      AuditLogger.logBlockUpdates(
        emptyMCP.contextual.data,
        [],
        "test-user-001",
        "visit-empty",
      );

      // Verificar que no se crearon logs
      const logs = AuditLogger.getAuditLogs();
      expect(logs.length).toBe(0);
    });
  });

  /**
   * CASO 3: Registrar actualizaciones con datos parciales
   *
   * El logger debe filtrar y registrar solo los cambios reales,
   * manejando correctamente datos parciales o incompletos
   */
  describe("Caso 3: Registro con datos parciales", () => {
    it("debe registrar solo los bloques que realmente cambiaron", () => {
      // Preparar bloques parciales
      const originalBlocks = partialMCP.contextual.data.map((block) => ({
        ...block,
      }));
      // Crear una copia con múltiples cambios, pero solo uno real
      const updatedBlocks = originalBlocks.map((block) => ({ ...block }));

      // Modificar solo un bloque
      if (updatedBlocks.length > 0) {
        updatedBlocks[0].content = "Contenido modificado para prueba";
      }

      // Registrar la actualización
      AuditLogger.logBlockUpdates(
        originalBlocks,
        updatedBlocks,
        "test-user-001",
        "visit-partial",
      );

      // Verificar los logs
      const logs = AuditLogger.getAuditLogs();

      // Debería haber un solo log (solo cambió un bloque)
      expect(logs.length).toBe(1);

      // Verificar que el log corresponde al bloque que cambió
      expect(logs[0].block_id).toBe(originalBlocks[0].id);
      expect(logs[0].old_content).toBe(originalBlocks[0].content);
      expect(logs[0].new_content).toBe("Contenido modificado para prueba");
    });

    it("debe ignorar bloques sin ID", () => {
      // Preparar bloques con y sin ID
      const originalBlocks = [
        { id: "valid-1", content: "Original 1", type: "contextual" },
        { content: "Sin ID", type: "contextual" }, // Intencionalmente sin ID
      ];

      const updatedBlocks = [
        { id: "valid-1", content: "Updated 1", type: "contextual" },
        { content: "Sin ID actualizado", type: "contextual" }, // Sigue sin ID
      ];

      // Registrar la actualización
      AuditLogger.logBlockUpdates(
        originalBlocks,
        updatedBlocks,
        "test-user-001",
        "visit-test",
      );

      // Verificar los logs
      const logs = AuditLogger.getAuditLogs();

      // Solo debería registrar el bloque con ID válido
      expect(logs.length).toBe(1);
      expect(logs[0].block_id).toBe("valid-1");
    });
  });

  /**
   * CASO 4: Gestión de la persistencia de logs
   *
   * El logger debe almacenar y permitir recuperar los logs correctamente,
   * manteniendo su integridad y estructura
   */
  describe("Caso 4: Persistencia de logs", () => {
    it("debe acumular múltiples logs en sesiones sucesivas", () => {
      // Primera sesión de logging
      AuditLogger.logBlockUpdates(
        [{ id: "block-1", content: "Original 1", type: "contextual" }],
        [{ id: "block-1", content: "Updated 1", type: "contextual" }],
        "user-1",
        "visit-1",
      );

      // Segunda sesión de logging
      AuditLogger.logBlockUpdates(
        [{ id: "block-2", content: "Original 2", type: "persistent" }],
        [{ id: "block-2", content: "Updated 2", type: "persistent" }],
        "user-2",
        "visit-2",
      );

      // Verificar que ambos logs están almacenados
      const logs = AuditLogger.getAuditLogs();
      expect(logs.length).toBe(2);

      // Verificar que los logs mantienen sus datos correctos
      const log1 = logs.find((log) => log.block_id === "block-1");
      const log2 = logs.find((log) => log.block_id === "block-2");

      expect(log1).toBeDefined();
      expect(log2).toBeDefined();
      expect(log1?.user_id).toBe("user-1");
      expect(log2?.user_id).toBe("user-2");
    });

    it("debe proporcionar una copia de los logs, no una referencia", () => {
      // Registrar un log
      AuditLogger.logBlockUpdates(
        [{ id: "block-1", content: "Original", type: "contextual" }],
        [{ id: "block-1", content: "Updated", type: "contextual" }],
        "user-1",
        "visit-1",
      );

      // Obtener los logs
      const logs = AuditLogger.getAuditLogs();
      const initialCount = logs.length;

      // Intentar modificar el array devuelto
      logs.push({
        timestamp: new Date().toISOString(),
        user_id: "hacker",
        visit_id: "fake",
        block_id: "fake",
        block_type: "contextual",
        operation: "update",
        old_content: "hack",
        new_content: "hack",
      });

      // Verificar que el array interno no fue modificado
      const freshLogs = AuditLogger.getAuditLogs();
      expect(freshLogs.length).toBe(initialCount);
    });
  });
});
