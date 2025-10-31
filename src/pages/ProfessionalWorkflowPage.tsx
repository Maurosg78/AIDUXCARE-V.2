// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useConsentCheck } from "../hooks/useConsentCheck";
import { ConsentRequiredBanner } from "../components/ConsentRequiredBanner";
import { WorkflowTabButton } from "../components/WorkflowTabButton";
import { WorkflowAnalysisTab } from "../components/WorkflowAnalysisTab";
import { PhysicalEvaluationTab } from "../components/PhysicalEvaluationTab";
import { SOAPDisplay } from "../components/SOAPDisplay";
import { useRecorder } from "../hooks/useRecorder";
import { useNiagaraProcessor } from "../hooks/useNiagaraProcessor";
import { SOAPGenerator } from "../services/soap-generator";
import { PatientData } from "../types/PatientData";

const ProfessionalWorkflowPage: React.FC = () => {
  const { isReady, hasConsent } = useConsentCheck();
  const [activeTab, setActiveTab] = useState<"analysis" | "evaluation" | "soap">("analysis");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [transcript, setTranscript] = useState("");
  const [localSoapNote, setLocalSoapNote] = useState<any>(null);
  const [physicalTestsToPerform, setPhysicalTestsToPerform] = useState<any[]>([]);
  const [niagaraResults, setNiagaraResults] = useState<any>(null);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);

  const {
    isRecording,
    startRecording,
    stopRecording,
    recordingTime
  } = useRecorder();

  const { handleAnalyzeWithAI, isAnalyzing } = useNiagaraProcessor();

  useEffect(() => {
    // Simulación de carga de paciente seleccionado
    setSelectedPatient({
      id: "123",
      name: "John Doe",
      age: 42,
      gender: "Male",
      condition: "Lumbar pain",
    });
  }, []);

  // --- Consentimiento ---
  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        <p>Checking PIPEDA consent...</p>
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <ConsentRequiredBanner onGoToConsent={() => (window.location.href = "/patient-consent")} />
    );
  }

  // --- Handlers ---
  const handleGenerateSOAP = async () => {
    if (!selectedPatient || !transcript) return;
    const soap = await SOAPGenerator.generateFromTranscript(transcript, selectedPatient);
    setLocalSoapNote(soap);
    setActiveTab("soap");
  };

  const handleContinueToEvaluation = () => {
    const selectedTestIds = selectedFindings.filter((id) => id.startsWith("test-"));
    let testsToPerform = [];

    if (niagaraResults?.rawResponse) {
      try {
        const rawJson = JSON.parse(
          niagaraResults.rawResponse.replace(/```json\n?/g, "").replace(/```/g, "")
        );
        if (rawJson.evaluaciones_fisicas_sugeridas) {
          testsToPerform = rawJson.evaluaciones_fisicas_sugeridas.filter((test, index) =>
            selectedTestIds.includes(`test-${index}`)
          );
        }
      } catch (err) {
        console.error("Error parsing Niagara response", err);
      }
    }

    setPhysicalTestsToPerform(testsToPerform);
    setActiveTab("evaluation");
  };

  // --- Render principal ---
  return (
    <>
      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <WorkflowTabButton
              label="1. Análisis Inicial"
              active={activeTab === "analysis"}
              onClick={() => setActiveTab("analysis")}
            />
            <WorkflowTabButton
              label="2. Evaluación Física"
              active={activeTab === "evaluation"}
              onClick={() => setActiveTab("evaluation")}
            />
            <WorkflowTabButton
              label="3. Informe SOAP"
              active={activeTab === "soap"}
              onClick={() => setActiveTab("soap")}
            />
          </div>
        </div>
      </div>

      {/* Contenido dinámico */}
      <main className="max-w-7xl mx-auto p-4">
        {activeTab === "analysis" && (
          <WorkflowAnalysisTab
            selectedPatient={selectedPatient}
            transcript={transcript}
            setTranscript={setTranscript}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            recordingTime={recordingTime}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyzeWithAI}
            niagaraResults={niagaraResults}
            selectedFindings={selectedFindings}
            setSelectedFindings={setSelectedFindings}
            onGenerateSOAP={handleGenerateSOAP}
            onContinueToEvaluation={handleContinueToEvaluation}
          />
        )}

        {activeTab === "evaluation" && (
          <>
            <PhysicalEvaluationTab
              suggestedTests={physicalTestsToPerform}
              onComplete={(results) => {
                handleGenerateSOAP();
                setActiveTab("soap");
              }}
            />
            <SOAPDisplay
              soapNote={localSoapNote}
              patientData={selectedPatient}
              onDownloadPDF={() => console.log("Downloading report...")}
            />
          </>
        )}

        {activeTab === "soap" && (
          <SOAPDisplay
            soapNote={localSoapNote}
            patientData={selectedPatient}
            onDownloadPDF={() => console.log("Downloading report...")}
          />
        )}
      </main>
    </>
  );
};

export default ProfessionalWorkflowPage;

