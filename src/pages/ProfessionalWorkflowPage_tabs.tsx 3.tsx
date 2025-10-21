// Agregar después de los imports existentes
const [activeTab, setActiveTab] = useState<'analysis' | 'evaluation' | 'soap'>('analysis');

// Agregar navegación de tabs antes del contenido principal
<div className="bg-white border-b mb-4">
  <div className="max-w-7xl mx-auto px-4">
    <nav className="flex space-x-8">
      <button 
        onClick={() => setActiveTab('analysis')}
        className={`py-3 px-4 border-b-2 font-medium text-sm ${
          activeTab === 'analysis' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        1. Análisis Inicial
      </button>
      <button 
        onClick={() => setActiveTab('evaluation')}
        disabled={!niagaraResults}
        className={`py-3 px-4 border-b-2 font-medium text-sm ${
          activeTab === 'evaluation' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        } ${!niagaraResults ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        2. Evaluación Física
      </button>
      <button 
        onClick={() => setActiveTab('soap')}
        disabled={!soapNote}
        className={`py-3 px-4 border-b-2 font-medium text-sm ${
          activeTab === 'soap' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700'
        } ${!soapNote ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        3. SOAP Report
      </button>
    </nav>
  </div>
</div>

{/* Contenido condicional según tab activo */}
{activeTab === 'analysis' && (
  <div className="p-4 text-center text-sm text-gray-500">Análisis en preparación</div>
)}

{activeTab === 'evaluation' && (
  <div className="text-center py-8">
    <h2 className="text-xl font-semibold mb-4">Evaluación Física</h2>
    <p>Próximamente: Captura rápida de evaluaciones</p>
  </div>
)}

{activeTab === 'soap' && (
  <div className="text-center py-8">
    <h2 className="text-xl font-semibold mb-4">SOAP Report</h2>
    {soapNote ? (
      <pre className="text-left whitespace-pre-wrap">{soapNote}</pre>
    ) : (
      <p>Complete la evaluación física primero</p>
    )}
  </div>
)}
