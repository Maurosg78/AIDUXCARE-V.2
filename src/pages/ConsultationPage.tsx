import React, { useState } from "react";
import { Tabs } from "@/shared/components/UI/Tabs";
// import CaptureWorkspace from '@/components/CaptureWorkspace'; // Si existe
// import SOAPEditor from '@/components/clinical/SOAPEditor'; // Placeholder
// import HumanFigure from '@/components/clinical/HumanFigure'; // Placeholder

// Simulación de datos de paciente y lógica de highlights/advertencias
const patientData = {
  id: "FT-2025-001",
  name: "María González Rodríguez",
  age: 45,
  condition: "Lumbalgia crónica L4-L5",
  allergies: ["AINEs", "Penicilina"],
  previousTreatments: [
    "Fisioterapia manual",
    "Electroterapia",
    "Ejercicio terapéutico",
  ],
  medications: ["Tramadol 50mg", "Omeprazol 20mg"],
  clinicalHistory:
    "Cirugía discectomía L4-L5 (2023), Diabetes tipo 2 controlada",
};

const ConsultationPage: React.FC = () => {
  const [showAssistant, setShowAssistant] = useState(false);

  // Simulación de highlights y advertencias
  const [highlights] = useState([
    {
      id: "1",
      text: "Dolor lumbar irradiado",
      category: "síntoma",
      confidence: 0.95,
    },
    {
      id: "2",
      text: "Limitación flexión",
      category: "hallazgo",
      confidence: 0.88,
    },
    {
      id: "3",
      text: "Test Lasègue positivo",
      category: "hallazgo",
      confidence: 0.92,
    },
  ]);
  const [legalWarnings] = useState([
    {
      id: "1",
      description: "Paciente alérgico a AINEs - evitar antiinflamatorios",
      severity: "alta",
    },
    {
      id: "2",
      description: "Diabetes - monitorear ejercicio intenso",
      severity: "media",
    },
  ]);

  const tabs = [
    {
      id: "captura",
      label: "Captura y Pre-evaluación",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Columna 1: Escucha activa / transcripción */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Escucha Activa</h3>
            <button className="w-full py-2 px-4 rounded bg-green-500 text-white font-medium">
              Iniciar Escucha
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Activa la transcripción automática del ambiente.
            </p>
          </div>
          {/* Columna 2: Highlights */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-2">Highlights de Conversación</h3>
            <ul className="space-y-2">
              {highlights.map((h) => (
                <li key={h.id} className="text-sm flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                  {h.text}{" "}
                  <span className="ml-2 text-xs text-gray-400">
                    ({h.category})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/* Columna 3: Advertencias */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-2 text-red-600">
              Advertencias Clínicas
            </h3>
            <ul className="space-y-2">
              {legalWarnings.map((w) => (
                <li key={w.id} className="text-sm flex items-center">
                  <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                  {w.description}{" "}
                  <span className="ml-2 text-xs text-gray-400">
                    ({w.severity})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "evaluacion",
      label: "Evaluación y SOAP Final",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Placeholder figura humana */}
          <div className="bg-white rounded-lg border p-6 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="font-semibold mb-4">Figura Humana (4 vistas)</h3>
            <div className="w-40 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              [Figura Humana]
            </div>
          </div>
          {/* Placeholder editor SOAP */}
          <div className="bg-white rounded-lg border p-6 flex flex-col min-h-[300px]">
            <h3 className="font-semibold mb-4">Editor SOAP</h3>
            <textarea
              className="w-full h-40 border rounded p-2 mb-2"
              placeholder="Escribe o edita la nota SOAP aquí..."
            />
            <button className="mt-2 px-4 py-2 rounded bg-primary text-white font-medium self-end">
              Guardar Nota
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Paciente */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-200">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "#2C3E50" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {patientData.name}
            </h1>
            <p className="text-sm text-gray-500">
              {patientData.age} años • {patientData.condition}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-md text-sm font-medium bg-primary text-white">
          {patientData.id}
        </span>
      </div>

      {/* Tabs principales */}
      <div className="max-w-6xl mx-auto mt-6">
        <Tabs tabs={tabs} />
      </div>

      {/* Asistente Virtual Flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="p-4 rounded-full shadow-lg bg-primary text-white hover:bg-green-700"
          onClick={() => setShowAssistant(true)}
        >
          <span className="font-bold">AIDUX</span> Asistente
        </button>
        {showAssistant && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold">AIDUX Asistente Virtual</h4>
              <button
                onClick={() => setShowAssistant(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-700">
              <p>Consultas disponibles:</p>
              <ul className="list-disc ml-5 mt-2">
                <li>Información de medicamentos</li>
                <li>Historia previa del paciente</li>
                <li>Términos médicos desconocidos</li>
                <li>Protocolos de tratamiento</li>
                <li>Contraindicaciones y alertas</li>
              </ul>
              <input
                className="mt-4 w-full border rounded p-2"
                placeholder="Escribe tu consulta..."
              />
              <button className="mt-2 px-4 py-2 rounded bg-primary text-white font-medium w-full">
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationPage;
