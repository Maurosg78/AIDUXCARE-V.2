/**
 * 🚀 RAG Integrated Demo Page - AiDuxCare V.2
 * Demostración completa del pipeline: Audio → STT → NLP → RAG → SOAP → UI
 */

import React, { useState, useCallback } from "react";
import { ProfessionalAudioProcessor } from "@/components/professional/ProfessionalAudioProcessor";
import EvidencePanel from "@/components/evidence/EvidencePanel";
import { AudioProcessingResult } from "@/services/AudioProcessingServiceProfessional";
import { RAGQueryResult, CitationReference } from "@/core/mcp/RAGMedicalMCP";
import { Button } from "@/shared/components/UI/Button";

interface RAGIntegratedDemoPageProps {
  visitId?: string;
  userId?: string;
  patientId?: string;
}

export const RAGIntegratedDemoPage: React.FC<RAGIntegratedDemoPageProps> = ({
  visitId = `demo_visit_${Date.now()}`,
  userId = "demo_user",
  patientId = `demo_patient_${Date.now()}`,
}) => {
  const [processingResult, setProcessingResult] =
    useState<AudioProcessingResult | null>(null);
  const [ragResult, setRagResult] = useState<RAGQueryResult | null>(null);
  const [selectedArticle, setSelectedArticle] =
    useState<CitationReference | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  /**
   * Maneja resultado del procesamiento de audio
   */
  const handleProcessingComplete = useCallback(
    (result: AudioProcessingResult) => {
      console.log("📋 Procesamiento completado:", result);
      setProcessingResult(result);

      // Extraer resultado RAG si está disponible
      if ("ragResult" in result && result.ragResult) {
        setRagResult(result.ragResult as RAGQueryResult);
      }
    },
    [],
  );

  /**
   * Maneja clic en artículo científico
   */
  const handleArticleClick = useCallback((citation: CitationReference) => {
    setSelectedArticle(citation);
    console.log("📚 Artículo seleccionado:", citation);
  }, []);

  /**
   * Ejecuta demo con datos simulados
   */
  const runSimulatedDemo = useCallback(async () => {
    setIsDemo(true);

    // Simular datos de prueba
    const mockResult: AudioProcessingResult = {
      transcription: [
        {
          id: "seg-1",
          timestamp: new Date().toISOString(),
          actor: "paciente",
          content:
            "Doctor, tengo un dolor muy fuerte en el cuello desde hace 3 días, especialmente cuando giro la cabeza hacia la derecha.",
          confidence: "entendido",
          approved: true,
          edited: false,
        },
        {
          id: "seg-2",
          timestamp: new Date().toISOString(),
          actor: "profesional",
          content:
            "Veo contractura muscular en el trapecio superior derecho. Vamos a aplicar técnicas de terapia manual y ejercicios de movilización.",
          confidence: "entendido",
          approved: true,
          edited: false,
        },
      ],
      entities: [
        {
          id: "rag_1",
          text: "dolor cervical",
          type: "symptom",
          confidence: 0.95,
        },
        {
          id: "rag_2",
          text: "contractura muscular",
          type: "symptom",
          confidence: 0.9,
        },
        {
          id: "rag_3",
          text: "terapia manual",
          type: "treatment",
          confidence: 0.88,
        },
        {
          id: "rag_4",
          text: "trapecio superior",
          type: "objective",
          confidence: 0.92,
        },
      ],
      soapNotes: {
        subjective:
          "Paciente refiere dolor cervical de 2 semanas de evolución...",
        objective: "Contractura del trapecio superior, ROM limitado...",
        assessment: "Síndrome cervical con componente miofascial...",
        plan: "Terapia manual 3x/semana, ejercicios domiciliarios...",
        generated_at: new Date(),
        confidence_score: 0.89,
      },
      agentSuggestions: [
        {
          id: "1",
          type: "recommendation",
          field: "treatment",
          content:
            "Considerar técnicas de Mulligan para dolor cervical específico",
          sourceBlockId: "block-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      metrics: {
        session_id: "rag-demo-session",
        total_processing_time_ms: 2800,
        stt_duration_ms: 0,
        stt_confidence: 1.0,
        entity_extraction_time_ms: 600,
        entities_extracted: 4,
        soap_generation_time_ms: 800,
        soap_completeness: 0.89,
        soap_confidence: 0.89,
        total_tokens_used: 1500,
        estimated_cost_usd: 0.0,
        overall_confidence: 0.88,
        requires_review: false,
      },
      qualityAssessment: {
        overall_score: 87,
        completeness: 90,
        clinical_relevance: 85,
        requires_review: false,
        confidence_level: "high",
        red_flags: [],
        recommendations: ["Documentación completa y profesional"],
      },
      processingId: "demo-processing-id",
      physiotherapyContext: {
        session: {
          visit_id: "demo-visit",
          patient_id: "demo-patient",
          date: new Date(),
          session_type: "follow_up",
          duration_minutes: 30,
          therapist_id: "therapist_demo",
        },
        patient_profile: {
          id: "demo-patient",
          name: "Paciente Demo",
          age: 45,
          gender: "M",
        },
        processed_transcript: {
          full_text: "Transcripción completa de la sesión...",
          segments: [],
          entities: [],
          language: "es",
          processing_time_ms: 2500,
          word_count: 45,
          confidence_average: 0.92,
        },
        context_version: "1.0.0",
        created_at: new Date(),
      },
    };

    // Simular resultado RAG también
    const mockRAGResult: RAGQueryResult = {
      query: "dolor cervical terapia manual evidence",
      relevant_chunks: [],
      medical_context:
        "La terapia manual ha demostrado eficacia en el tratamiento del dolor cervical agudo según múltiples estudios randomizados controlados.",
      confidence_score: 0.78,
      citations: [
        {
          document_id: "pubmed_40439260",
          title:
            "The Effectiveness of Mulligan's Techniques in Non-Specific Neck Pain: A Systematic Review",
          authors: "Barbosa-Silva J, Luc A, Sobral de Oliveira-Souza AI",
          journal: "Physiotherapy Research International",
          year: "2025",
          pmid: "40439260",
          relevance_score: 0.85,
        },
        {
          document_id: "pubmed_40452767",
          title:
            "Comparative safety and efficacy of manual therapy interventions for cervicogenic headache",
          authors: "Xu X, Ling Y",
          journal: "Frontiers in Neurology",
          year: "2025",
          pmid: "40452767",
          relevance_score: 0.78,
        },
      ],
      processing_time_ms: 1650,
    };

    setProcessingResult(mockResult);
    setRagResult(mockRAGResult);

    setTimeout(() => setIsDemo(false), 500);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 AiDuxCare V.2 - Demo Integrado RAG + NLP
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Pipeline completo: Audio → Transcripción → NLP → RAG → SOAP +
            Evidencia Científica
          </p>
          <div className="flex justify-center gap-4">
            <div className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
              💰 Costo: $0.00
            </div>
            <div className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">
              🔒 100% Local
            </div>
            <div className="bg-purple-100 px-3 py-1 rounded-full text-sm text-purple-800">
              🔬 PubMed Integration
            </div>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Controles de Demostración
              </h2>
              <p className="text-sm text-gray-600">
                Prueba el sistema con audio real o datos simulados
              </p>
            </div>
            <Button
              variant="outline"
              onClick={runSimulatedDemo}
              disabled={isDemo}
              className="flex items-center gap-2"
            >
              {isDemo ? "⏳ Simulando..." : "🎬 Demo Simulado"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audio Processor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ProfessionalAudioProcessor
                visitId={visitId}
                userId={userId}
                patientId={patientId}
                onProcessingComplete={handleProcessingComplete}
                onError={(error) => console.error("Error:", error)}
              />
            </div>

            {/* Results Display */}
            {processingResult && (
              <div className="mt-6 space-y-6">
                {/* SOAP Notes */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📋 Notas SOAP Generadas
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Subjetivo (S)
                      </h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                        {processingResult.soapNotes.subjective}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Objetivo (O)
                      </h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                        {processingResult.soapNotes.objective}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Análisis (A)
                      </h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                        {processingResult.soapNotes.assessment}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Plan (P)</h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                        {processingResult.soapNotes.plan}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Entities */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🏷️ Entidades Clínicas ({processingResult.entities.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {processingResult.entities.map((entity, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {entity.type}: {entity.text} (
                        {Math.round(entity.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Evidence Panel */}
          <div className="lg:col-span-1">
            <EvidencePanel
              ragResult={ragResult || undefined}
              isLoading={isDemo}
              onArticleClick={handleArticleClick}
              onRefresh={() => console.log("Refresh RAG")}
            />
          </div>
        </div>

        {/* Article Detail Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📚 Detalle del Artículo
                  </h3>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-800">Título</h4>
                    <p className="text-gray-600">{selectedArticle.title}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800">Autores</h4>
                    <p className="text-gray-600">{selectedArticle.authors}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800">Revista</h4>
                    <p className="text-gray-600">
                      {selectedArticle.journal} ({selectedArticle.year})
                    </p>
                  </div>

                  {selectedArticle.pmid && (
                    <div>
                      <h4 className="font-medium text-gray-800">PMID</h4>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${selectedArticle.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {selectedArticle.pmid} (Ver en PubMed ↗)
                      </a>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-800">Relevancia</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${selectedArticle.relevance_score * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
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
        {processingResult && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Métricas de Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {processingResult.metrics.total_processing_time_ms}ms
                </div>
                <div className="text-sm text-gray-600">Tiempo Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {processingResult.entities.length}
                </div>
                <div className="text-sm text-gray-600">Entidades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {ragResult?.citations.length || 0}
                </div>
                <div className="text-sm text-gray-600">Artículos RAG</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">$0.00</div>
                <div className="text-sm text-gray-600">Costo</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RAGIntegratedDemoPage;
