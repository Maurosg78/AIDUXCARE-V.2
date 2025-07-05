/**
 * 🚀 Advanced AI Demo Page - AiDuxCare V.2 Fase 5
 * Demostración completa de capacidades avanzadas de IA:
 * Audio → STT → NLP → RAG → Clinical Insights → Professional UI
 */

import React, { useState, useCallback } from "react";
import { ProfessionalAudioProcessor } from "@/components/professional/ProfessionalAudioProcessor";
import EvidencePanel from "@/components/evidence/EvidencePanel";
import ClinicalInsightsPanel from "@/components/insights/ClinicalInsightsPanel";
import PromptTestingWidget from "@/components/testing/PromptTestingWidget";
import { AudioProcessingResult } from "@/services/AudioProcessingServiceProfessional";
import { RAGQueryResult, CitationReference } from "@/core/mcp/RAGMedicalMCP";
import {
  ClinicalPattern,
  ClinicalAlert,
  ProactiveRecommendation,
} from "@/core/ai/ClinicalInsightsEngine";
import { Button } from "@/shared/components/UI/Button";

interface AdvancedAIDemoPageProps {
  visitId?: string;
  userId?: string;
  patientId?: string;
}

export const AdvancedAIDemoPage: React.FC<AdvancedAIDemoPageProps> = ({
  visitId = `advanced_demo_${Date.now()}`,
  userId = "demo_user_ai",
  patientId = `demo_patient_ai_${Date.now()}`,
}) => {
  const [processingResult, setProcessingResult] =
    useState<AudioProcessingResult | null>(null);
  const [ragResult, setRagResult] = useState<RAGQueryResult | null>(null);
  const [selectedArticle, setSelectedArticle] =
    useState<CitationReference | null>(null);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoStep, setDemoStep] = useState<string>("");

  /**
   * Maneja resultado del procesamiento avanzado
   */
  const handleAdvancedProcessingComplete = useCallback(
    (result: AudioProcessingResult) => {
      console.log("🧠 Procesamiento IA avanzado completado:", result);
      setProcessingResult(result);

      // Extraer resultado RAG si está disponible
      if ("ragResult" in result && result.ragResult) {
        setRagResult(result.ragResult as RAGQueryResult);
      }
    },
    [],
  );

  /**
   * Demo automático con todas las capacidades de IA
   */
  const runAdvancedAIDemo = useCallback(async () => {
    setIsRunningDemo(true);
    setProcessingResult(null);
    setRagResult(null);

    // Simulación paso a paso del pipeline avanzado
    const steps = [
      "Iniciando captura de audio avanzada...",
      "Procesando Speech-to-Text con IA...",
      "Extrayendo entidades clínicas...",
      "Buscando evidencia científica (RAG)...",
      "Generando notas SOAP enriquecidas...",
      "Analizando patrones clínicos...",
      "Detectando alertas médicas...",
      "Generando recomendaciones proactivas...",
      "Integrando insights de IA clínica...",
      "Completando análisis avanzado...",
    ];

    for (const step of steps) {
      setDemoStep(step);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Datos de demo altamente realistas para Fase 5
    const mockAdvancedResult: AudioProcessingResult = {
      transcription: [
        {
          id: "adv_ts_1",
          content:
            "Paciente Carlos refiere dolor cervical persistente desde hace 3 semanas tras episodio de latigazo cervical en accidente de tráfico",
          timestamp: new Date(Date.now()).toISOString(),
          actor: "paciente",
          confidence: "entendido",
        },
        {
          id: "adv_ts_2",
          content:
            "Evaluación física revela limitación significativa en rotación derecha, contractura del trapecio superior y puntos gatillo activos",
          timestamp: new Date(Date.now() + 15000).toISOString(),
          actor: "profesional",
          confidence: "entendido",
        },
        {
          id: "adv_ts_3",
          content:
            "Aplicamos técnicas de Mulligan para articulación C1-C2, liberación miofascial instrumentada y ejercicios de control motor",
          timestamp: new Date(Date.now() + 30000).toISOString(),
          actor: "profesional",
          confidence: "entendido",
        },
        {
          id: "adv_ts_4",
          content:
            "El paciente reporta alivio del 60% inmediatamente post-tratamiento, especialmente en la rotación cervical",
          timestamp: new Date(Date.now() + 45000).toISOString(),
          actor: "profesional",
          confidence: "entendido",
        },
      ],
      entities: [
        {
          id: "demo_1",
          type: "symptom",
          text: "dolor cervical persistente",
          confidence: 0.95,
        },
        {
          id: "demo_2",
          type: "diagnosis",
          text: "latigazo cervical post-traumático",
          confidence: 0.9,
        },
        {
          id: "demo_3",
          type: "treatment",
          text: "técnicas de Mulligan C1-C2",
          confidence: 0.92,
        },
        {
          id: "demo_4",
          type: "treatment",
          text: "liberación miofascial instrumentada",
          confidence: 0.88,
        },
        {
          id: "demo_5",
          type: "objective",
          text: "contractura del trapecio superior",
          confidence: 0.93,
        },
        {
          id: "demo_6",
          type: "progress",
          text: "alivio del 60% post-tratamiento",
          confidence: 0.87,
        },
      ],
      soapNotes: {
        subjective:
          "Paciente refiere dolor cervical persistente desde accidente vehicular hace 6 meses. Intensidad 7/10, empeora con movimientos rotacionales.",
        objective:
          "Contractura evidente del trapecio superior bilateral. ROM cervical limitado 40%. Test de Spurling positivo bilateral.",
        assessment:
          "Latigazo cervical post-traumático con componente muscular predominante. Compromiso biomecánico C1-C2.",
        plan: "Técnicas de Mulligan específicas C1-C2, liberación miofascial instrumentada, programa ejercicios domiciliarios.",
        generated_at: new Date(),
        confidence_score: 0.92,
      },
      agentSuggestions: [
        {
          id: "adv_1",
          type: "recommendation",
          field: "treatment",
          content:
            "Considerar integración de neuromodulación transcutánea para optimizar control del dolor neuropático asociado",
          sourceBlockId: "advanced-block-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "adv_2",
          type: "warning",
          field: "treatment",
          content:
            "Vigilar evolución de cefaleas - evaluar posible componente cervicogénico que requiera intervención específica",
          sourceBlockId: "advanced-block-2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      metrics: {
        session_id: "demo_session_advanced_ai",
        total_processing_time_ms: 3200,
        stt_duration_ms: 0,
        stt_confidence: 1.0,
        entity_extraction_time_ms: 1200,
        entities_extracted: 6,
        soap_generation_time_ms: 1200,
        soap_completeness: 0.92,
        soap_confidence: 0.92,
        total_tokens_used: 2100,
        estimated_cost_usd: 0.0,
        overall_confidence: 0.91,
        requires_review: false,
      },
      qualityAssessment: {
        overall_score: 94,
        completeness: 95,
        clinical_relevance: 93,
        requires_review: false,
        confidence_level: "high",
        red_flags: [],
        recommendations: [
          "Documentación de alta calidad",
          "Enfoque terapéutico apropiado",
          "Seguimiento clínico adecuado",
        ],
      },
      processingId: "advanced-demo-processing-id",
      physiotherapyContext: {
        session: {
          visit_id: visitId,
          patient_id: patientId,
          date: new Date(),
          session_type: "follow_up",
          duration_minutes: 45,
          therapist_id: userId,
        },
        patient_profile: {
          id: patientId,
          name: "Carlos Mendoza",
          age: 35,
          gender: "M",
        },
        processed_transcript: {
          full_text:
            "Transcripción completa de sesión avanzada con técnicas especializadas...",
          segments: [],
          entities: [],
          language: "es",
          processing_time_ms: 4200,
          word_count: 127,
          confidence_average: 0.94,
        },
        context_version: "2.0.0",
        created_at: new Date(),
      },
      // **NUEVO: Insights Clínicos Avanzados**
      clinicalInsights: {
        patterns: [
          {
            id: "pattern_trauma_recovery",
            type: "progression",
            pattern:
              "Patrón de recuperación post-traumática con respuesta favorable a terapia manual especializada",
            confidence: 0.88,
            significance: "high",
            evidence_support: {
              scientific_articles: 3,
              evidence_level: "scientific_literature",
              clinical_guidelines: true,
              expert_consensus: true,
              strength_of_recommendation: "strong",
            },
            recommended_actions: [
              "Continuar con enfoque de terapia manual especializada",
              "Monitorear progreso funcional con escalas validadas",
              "Considerar alta temprana si progreso se mantiene",
            ],
            detected_at: new Date(),
          },
          {
            id: "pattern_multimodal_approach",
            type: "treatment",
            pattern:
              "Enfoque multimodal óptimo: manual + ejercicio + educación para síndrome cervical",
            confidence: 0.92,
            significance: "high",
            evidence_support: {
              scientific_articles: 5,
              evidence_level: "level_1",
              clinical_guidelines: true,
              expert_consensus: true,
              strength_of_recommendation: "strong",
            },
            recommended_actions: [
              "Mantener combinación actual de intervenciones",
              "Incrementar gradualmente componente de ejercicio",
              "Reforzar estrategias de educación en dolor",
            ],
            detected_at: new Date(),
          },
        ],
        alerts: [
          {
            id: "alert_cervicogenic_headache",
            severity: "warning",
            category: "quality",
            title: "Vigilancia de Cefalea Cervicogénica",
            description:
              "Presencia de cefaleas asociadas a disfunción cervical requiere monitoreo específico",
            rationale:
              "Las cefaleas cervicogénicas pueden requerir tratamiento dirigido específico para optimizar resultados",
            evidence_based: true,
            immediate_actions: [
              "Evaluación específica de articulación atlantooccipital",
              "Considerar técnicas específicas para cefalea cervicogénica",
              "Monitoreo de frecuencia e intensidad de cefaleas",
            ],
            follow_up_required: true,
            created_at: new Date(),
          },
        ],
        recommendations: [
          {
            id: "rec_ergonomic_optimization",
            type: "preventive",
            priority: "high",
            title: "Optimización Ergonómica Integral",
            description:
              "Implementar programa de ergonomía específico para prevenir recurrencias post-trauma cervical",
            clinical_justification:
              "La modificación ergonómica es crucial para prevenir recurrencias en síndrome cervical post-traumático",
            expected_outcomes: [
              "Reducción del 70% en riesgo de recurrencia",
              "Mejora en postura laboral y AVD",
              "Optimización de patrones de movimiento cervical",
            ],
            implementation_steps: [
              "Evaluación ergonómica del puesto de trabajo",
              "Implementación de pausas activas específicas",
              "Entrenamiento en higiene postural cervical",
              "Seguimiento a 4 semanas de implementación",
            ],
            evidence_support: {
              scientific_articles: 7,
              evidence_level: "level_2",
              clinical_guidelines: true,
              expert_consensus: true,
              strength_of_recommendation: "strong",
            },
            created_at: new Date(),
          },
        ],
        overall_assessment: {
          clinical_complexity: "medium",
          intervention_urgency: "routine",
          prognosis_indicator: "excellent",
          quality_score: 94,
        },
        processing_metadata: {
          insights_generated: 4,
          evidence_sources: 15,
          processing_time_ms: 1800,
          ai_confidence: 0.9,
        },
      },
    };

    // Simular resultado RAG también
    const mockRAGResult: RAGQueryResult = {
      query: "latigazo cervical técnicas Mulligan evidencia científica",
      relevant_chunks: [],
      medical_context:
        "Las técnicas de Mulligan han demostrado eficacia superior en el tratamiento del latigazo cervical comparado con terapia convencional, con mejoras significativas en dolor y función según systematic reviews de alta calidad.",
      confidence_score: 0.87,
      citations: [
        {
          document_id: "pubmed_advanced_1",
          title:
            "Efficacy of Mulligan techniques in whiplash-associated disorders: A systematic review and meta-analysis",
          authors: "Thomson D, Russell T, Bialocerkowski A",
          journal: "Physical Therapy in Sport",
          year: "2025",
          pmid: "40567890",
          relevance_score: 0.92,
        },
        {
          document_id: "pubmed_advanced_2",
          title:
            "Multimodal physiotherapy versus exercise therapy for chronic whiplash: Randomized controlled trial",
          authors: "Stewart MJ, Maher CG, Refshauge KM",
          journal: "Archives of Physical Medicine and Rehabilitation",
          year: "2025",
          pmid: "40567891",
          relevance_score: 0.89,
        },
        {
          document_id: "pubmed_advanced_3",
          title:
            "Cervicogenic headache treatment protocols: Evidence-based clinical guidelines 2025",
          authors: "International Headache Society",
          journal: "Cephalalgia",
          year: "2025",
          pmid: "40567892",
          relevance_score: 0.85,
        },
      ],
      processing_time_ms: 1650,
    };

    setProcessingResult(mockAdvancedResult);
    setRagResult(mockRAGResult);
    setDemoStep("¡Demo de IA avanzada completado!");

    setTimeout(() => {
      setIsRunningDemo(false);
      setDemoStep("");
    }, 1000);
  }, [visitId, patientId, userId]);

  /**
   * Manejadores de eventos del Clinical Insights Panel
   */
  const handlePatternClick = useCallback((pattern: ClinicalPattern) => {
    console.log("🔍 Patrón clínico seleccionado:", pattern);
    // Aquí se podría mostrar un modal con detalles del patrón
  }, []);

  const handleAlertAction = useCallback(
    (alert: ClinicalAlert, action: string) => {
      console.log("⚠️ Acción de alerta ejecutada:", {
        alert: alert.title,
        action,
      });
      // Aquí se ejecutarían las acciones específicas
    },
    [],
  );

  const handleRecommendationAccept = useCallback(
    (recommendation: ProactiveRecommendation) => {
      console.log("💡 Recomendación aceptada:", recommendation.title);
      // Aquí se integraría la recomendación en el plan de tratamiento
    },
    [],
  );

  return (
    <div className="advanced-ai-demo-page min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧠 AiDuxCare V.2 - Advanced AI Demo
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Demostración completa de capacidades avanzadas de IA clínica
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              🔬 RAG Medical
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              🧠 Clinical Insights
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              📊 Advanced Analytics
            </span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              ⚡ Real-time Processing
            </span>
          </div>

          <Button
            onClick={runAdvancedAIDemo}
            disabled={isRunningDemo}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
          >
            {isRunningDemo
              ? "🔄 Procesando IA..."
              : "🚀 Ejecutar Demo Avanzado"}
          </Button>

          {demoStep && (
            <div className="mt-4 bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                <span className="text-purple-700 font-medium">{demoStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Audio Processing Column */}
          <div className="xl:col-span-1">
            <ProfessionalAudioProcessor
              visitId={visitId}
              userId={userId}
              patientId={patientId}
              onProcessingComplete={handleAdvancedProcessingComplete}
              className="h-full"
            />
          </div>

          {/* Evidence & Insights Column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Evidence Panel */}
            <EvidencePanel
              ragResult={ragResult || undefined}
              isLoading={isRunningDemo}
              onArticleClick={setSelectedArticle}
              onRefresh={() => console.log("Refresh RAG")}
              className="h-96"
            />

            {/* Processing Results */}
            {processingResult && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Resultados del Procesamiento
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {processingResult.entities.length}
                    </div>
                    <div className="text-sm text-blue-700">
                      Entidades Clínicas
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {processingResult.qualityAssessment.overall_score}
                    </div>
                    <div className="text-sm text-green-700">
                      Score de Calidad
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {processingResult.metrics.total_processing_time_ms}ms
                    </div>
                    <div className="text-sm text-purple-700">Tiempo Total</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      $0.00
                    </div>
                    <div className="text-sm text-orange-700">Costo IA</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Insights Column */}
          <div className="xl:col-span-1">
            <ClinicalInsightsPanel
              insights={processingResult?.clinicalInsights}
              isLoading={isRunningDemo}
              onPatternClick={handlePatternClick}
              onAlertAction={handleAlertAction}
              onRecommendationAccept={handleRecommendationAccept}
              className="h-full"
            />
          </div>
        </div>

        {/* Article Detail Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    📚 Detalle Científico
                  </h3>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800">Título</h4>
                    <p className="text-gray-700">{selectedArticle.title}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800">Autores</h4>
                    <p className="text-gray-700">{selectedArticle.authors}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800">Publicación</h4>
                    <p className="text-gray-700">
                      {selectedArticle.journal} ({selectedArticle.year})
                    </p>
                  </div>

                  {selectedArticle.pmid && (
                    <div>
                      <h4 className="font-semibold text-gray-800">PMID</h4>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${selectedArticle.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {selectedArticle.pmid} (Ver en PubMed ↗)
                      </a>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Relevancia Clínica
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                          style={{
                            width: `${selectedArticle.relevance_score * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {Math.round(selectedArticle.relevance_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            🏆 Capacidades de IA Avanzada - Fase 5
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-sm text-gray-600">Procesamiento Local</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                35M+
              </div>
              <div className="text-sm text-gray-600">Artículos PubMed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                &lt;3s
              </div>
              <div className="text-sm text-gray-600">Pipeline Completo</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                $0.00
              </div>
              <div className="text-sm text-gray-600">Costo Operativo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Testing Widget para A/B Testing */}
      <PromptTestingWidget />
    </div>
  );
};

export default AdvancedAIDemoPage;
