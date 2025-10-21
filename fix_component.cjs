const fs = require('fs');

const filePath = 'src/pages/ProfessionalWorkflowPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the WorkflowAnalysisTab component with all required props
const oldPattern = /<WorkflowAnalysisTab[\s\S]*?\/>/;

const newComponent = `<WorkflowAnalysisTab
                  selectedPatient={selectedPatient}
                  transcript={transcript}
                  setTranscript={setTranscript}
                  isRecording={isRecording}
                  startRecording={handleStartRecording}
                  stopRecording={handleStopRecording}
                  recordingTime="00:00"
                  isAnalyzing={isAnalyzing}
                  isTranscribing={false}
                  onAnalyze={handleAnalyze}
                  niagaraResults={analysisResults}
                  selectedFindings={selectedIds}
                  setSelectedFindings={setSelectedIds}
                  onGenerateSOAP={handleGenerateSOAP}
                  onContinueToEvaluation={() => setActiveTab("evaluation")}
                  physicalExamResults={[]}
                  handleExamResultsChange={() => {}}
                />`;

content = content.replace(oldPattern, newComponent);
fs.writeFileSync(filePath, content);
console.log('Fixed WorkflowAnalysisTab component');
