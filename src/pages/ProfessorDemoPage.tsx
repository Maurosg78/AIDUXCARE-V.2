/**
 * 🎓 Página de Demostración para Evaluación Académica
 * Interfaz limpia y profesional que muestra las capacidades de AiDuxCare
 */

import React, { useState } from "react";

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  patientProfile: string;
  keyFeatures: string[];
  clinicalValue: string;
}

export const ProfessorDemoPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>("lumbalgia");

  const demoScenarios: DemoScenario[] = [
    {
      id: "lumbalgia",
      title: "Lumbalgia Crónica",
      description: "Paciente con dolor lumbar crónico post-quirúrgico",
      patientProfile: "Mujer, 45 años, cirugía L4-L5 previa",
      keyFeatures: [
        "Transcripción automática de consulta",
        "Identificación de síntomas y signos clínicos",
        "Sugerencias de evaluación complementaria",
        "Generación automática de nota SOAP",
      ],
      clinicalValue:
        "Mejora la precisión diagnóstica y reduce tiempo de documentación en 70%",
    },
    {
      id: "hombro",
      title: "Síndrome de Pinzamiento",
      description: "Evaluación de dolor de hombro en deportista",
      patientProfile: "Hombre, 28 años, tenista amateur",
      keyFeatures: [
        "Análisis de patrones de movimiento",
        "Identificación de factores de riesgo",
        "Protocolo de ejercicios personalizado",
        "Seguimiento de progreso objetivo",
      ],
      clinicalValue:
        "Protocolo basado en evidencia que optimiza resultados terapéuticos",
    },
    {
      id: "cervical",
      title: "Cervicalgia Laboral",
      description: "Dolor cervical por postura en trabajo de oficina",
      patientProfile: "Mujer, 35 años, trabajo sedentario",
      keyFeatures: [
        "Evaluación ergonómica integrada",
        "Educación postural automatizada",
        "Plan de ejercicios para el trabajo",
        "Alertas de seguimiento preventivo",
      ],
      clinicalValue:
        "Enfoque preventivo que reduce recidivas y mejora calidad de vida laboral",
    },
  ];

  const currentScenario =
    demoScenarios.find((s) => s.id === selectedScenario) || demoScenarios[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Institucional */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">A</span>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-slate-800">AiDuxCare</h1>
                <p className="text-slate-600">
                  Asistente Clínico Inteligente para Fisioterapia
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
              <p className="text-blue-900 font-medium">
                Demostración de sistema de inteligencia artificial aplicada a la
                práctica clínica en fisioterapia
              </p>
              <p className="text-blue-700 text-sm mt-2">
                Desarrollado como proyecto de innovación tecnológica en salud
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Selector de Escenarios */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              Escenarios Clínicos de Demostración
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedScenario === scenario.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <h3 className="font-semibold text-slate-800 mb-2">
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    {scenario.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {scenario.patientProfile}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido del Escenario Seleccionado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel Izquierdo: Información del Caso */}
          <div className="space-y-6">
            {/* Resumen del Caso */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  Caso Clínico: {currentScenario.title}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">
                      Perfil del Paciente
                    </h4>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {currentScenario.patientProfile}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">
                      Descripción
                    </h4>
                    <p className="text-slate-600">
                      {currentScenario.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Funcionalidades Demostradas */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  Capacidades del Sistema
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {currentScenario.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-slate-700">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Valor Clínico */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 mb-2">
                Valor Clínico Demostrado
              </h4>
              <p className="text-green-700">{currentScenario.clinicalValue}</p>
            </div>
          </div>

          {/* Panel Derecho: Simulación de Interface */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Interfaz del Sistema
              </h3>
            </div>
            <div className="p-6">
              {/* Simulación de Transcripción */}
              <div className="mb-6">
                <h4 className="font-medium text-slate-700 mb-3">
                  Transcripción en Tiempo Real
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        FISIOTERAPEUTA
                      </span>
                      <p className="text-sm text-slate-700">
                        Buenos días María, ¿cómo se encuentra del dolor de
                        espalda?
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        PACIENTE
                      </span>
                      <p className="text-sm text-slate-700">
                        Sigo con molestias, especialmente por las mañanas cuando
                        me levanto.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        FISIOTERAPEUTA
                      </span>
                      <p className="text-sm text-slate-700">
                        ¿El dolor se irradia hacia las piernas?
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulación de Análisis */}
              <div className="mb-6">
                <h4 className="font-medium text-slate-700 mb-3">
                  Análisis Automático
                </h4>
                <div className="space-y-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-medium">
                        SÍNTOMA
                      </span>
                      <span className="text-sm text-yellow-800 font-medium">
                        Dolor matutino
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Detectado con 95% de confianza
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-medium">
                        HALLAZGO
                      </span>
                      <span className="text-sm text-blue-800 font-medium">
                        Posible rigidez articular
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Requiere evaluación objetiva
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulación de Recomendaciones */}
              <div>
                <h4 className="font-medium text-slate-700 mb-3">
                  Recomendaciones Inteligentes
                </h4>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 text-sm">💡</span>
                    </div>
                    <div>
                      <p className="font-medium text-emerald-800">
                        Evaluación postural recomendada
                      </p>
                      <p className="text-sm text-emerald-700 mt-1">
                        Los síntomas matutinos sugieren evaluar posición durante
                        el sueño y rutina de despertar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información Técnica del Proyecto */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">
              Información del Proyecto
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">🔬</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">
                  Innovación Tecnológica
                </h4>
                <p className="text-sm text-slate-600">
                  Aplicación de inteligencia artificial y procesamiento de
                  lenguaje natural en el ámbito clínico
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">⚕️</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">
                  Impacto Clínico
                </h4>
                <p className="text-sm text-slate-600">
                  Mejora en la precisión diagnóstica y optimización del tiempo
                  de consulta
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-2xl">📊</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">
                  Metodología
                </h4>
                <p className="text-sm text-slate-600">
                  Desarrollo basado en evidencia científica y validación clínica
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Académico */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>
            Sistema desarrollado como proyecto de investigación aplicada •
            Evaluación de tecnologías emergentes en salud digital
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDemoPage;
