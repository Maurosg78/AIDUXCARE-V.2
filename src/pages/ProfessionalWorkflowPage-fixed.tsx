// ... imports anteriores ...

const ProfessionalWorkflowPage: React.FC = () => {
  // ... resto del código ...

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* ... header ... */}
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'analysis' && (
            <>
              <WorkflowAnalysisTab
                // ... props ...
              />
              
              {/* CAMBIO CRÍTICO: Mostrar botones siempre, pero deshabilitados si no hay texto */}
              <div className="mt-6 pt-6 border-t">
                <AnalysisButtons
                  onAnalyzeNormal={handleAnalyzeNormal}
                  onAnalyzePro={handleAnalyzePro}
                  isProcessing={isProcessing}
                  suggestPro={shouldSuggestPro}
                  credits={credits}
                  disabled={!transcript || transcript.length < 10} // Nuevo prop
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
