/**
 * Script para depurar el funcionamiento del MCPContextBuilder
 *
 * Este script muestra el resultado del builder con cada tipo de entrada
 * para ayudar a diagnosticar problemas.
 */
import { buildMCPContext } from "./MCPContextBuilder";

// Crear datos de prueba manualmente en lugar de importar los mocks
// para evitar problemas de rutas

// Timestamp común para todos los registros
const NOW = new Date().toISOString();

// 1. DATOS COMPLETOS
console.log("CASO 1: DATOS COMPLETOS");
const fullContext = buildMCPContext(
  {
    source: "test-data",
    data: [
      {
        id: "ctx-001",
        created_at: NOW,
        type: "contextual",
        content:
          "Paciente femenina de 65 años acude a consulta por dolor torácico",
        visit_id: "visit-12345",
        patient_id: "patient-6789",
      },
    ],
  },
  {
    source: "test-data",
    data: [
      {
        id: "per-001",
        created_at: NOW,
        type: "persistent",
        content:
          "Antecedentes: Hipertensión arterial, Diabetes mellitus tipo 2",
        patient_id: "patient-6789",
      },
    ],
  },
  {
    source: "test-data",
    data: [
      {
        id: "sem-001",
        created_at: NOW,
        type: "semantic",
        content:
          "El dolor torácico puede estar asociado a cardiopatía isquémica",
      },
    ],
  },
);
console.log(JSON.stringify(fullContext, null, 2));
console.log("\n");

// 2. DATOS CON CAMPOS FALTANTES
console.log("CASO 2: CAMPOS FALTANTES");
const missingContext = buildMCPContext(
  {
    source: "test-data",
    data: [
      {
        id: "missing-ctx-001",
        created_at: NOW,
        type: "contextual",
        content: "Paciente con dolor abdominal",
        // Sin visit_id
        patient_id: "patient-9876",
      },
    ],
  },
  {
    source: "test-data",
    data: [
      {
        id: "missing-per-001",
        created_at: NOW,
        type: "persistent",
        content: "Antecedentes: Ninguno relevante",
        // Sin patient_id
      },
    ],
  },
  {
    source: "test-data",
    data: [
      {
        id: "missing-sem-001",
        created_at: NOW,
        type: "semantic",
        content: "El dolor abdominal puede tener múltiples causas",
      },
    ],
  },
);
console.log(JSON.stringify(missingContext, null, 2));
console.log("\n");

// 3. DATOS INCONSISTENTES
console.log("CASO 3: DATOS INCONSISTENTES");
const inconsistentContext = buildMCPContext(
  {
    source: "test-data",
    data: [
      {
        id: "inconsistent-ctx-001",
        created_at: NOW,
        type: "contextual",
        content: "Paciente con dolor epigástrico",
        visit_id: "visit-54321",
        patient_id: "patient-54321",
      },
      {
        id: "inconsistent-ctx-002",
        created_at: "fecha-invalida", // Formato inválido
        type: "contextual",
        content: "", // Contenido vacío
        visit_id: "visit-54321",
        patient_id: "patient-54321",
      },
    ],
  },
  {
    source: "test-data",
    data: [
      {
        id: "inconsistent-per-001",
        // Sin created_at
        type: "persistent",
        content: "Antecedentes: Gastritis crónica",
        patient_id: "patient-54321",
      },
    ],
  },
  {
    source: "test-data",
    data: [
      {
        id: "inconsistent-sem-001",
        created_at: NOW,
        type: "semantic",
        content:
          "El dolor epigástrico puede estar asociado a enfermedad ácido-péptica",
      },
      {
        id: "inconsistent-sem-002",
        created_at: NOW,
        type: "semantic",
        content: null, // Contenido null
      },
    ],
  },
);
console.log(JSON.stringify(inconsistentContext, null, 2));
console.log("\n");

// 4. DATOS MÍNIMOS
console.log("CASO 4: DATOS MÍNIMOS");
const minimalContext = buildMCPContext(
  {
    source: "test-data",
    data: [
      {
        id: "minimal-ctx-001",
        created_at: NOW,
        type: "contextual",
        content: "Paciente acude a control. Sin síntomas activos.",
        visit_id: "visit-minimal",
      },
    ],
  },
  {
    source: "test-data",
    data: [
      {
        id: "minimal-per-001",
        created_at: NOW,
        type: "persistent",
        content: "Sin antecedentes patológicos de relevancia.",
        patient_id: "patient-minimal",
      },
    ],
  },
  {
    source: "test-data",
    data: [], // Array vacío
  },
);
console.log(JSON.stringify(minimalContext, null, 2));
