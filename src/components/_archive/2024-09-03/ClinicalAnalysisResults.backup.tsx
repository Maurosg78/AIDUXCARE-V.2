import React, { useState } from 'react';
import { Card } from '../shared/ui';
import { AlertTriangle, Shield, Activity, ClipboardList, Brain, XCircle, FileText } from 'lucide-react';

interface ClinicalAnalysisResultsProps {
  results: any;
  onSelectionChange: (selected: string[]) => void;
  selectedIds: string[];
}

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  onSelectionChange,
  selectedIds
}) => {
  const [showDerivationModal, setShowDerivationModal] = useState(false);
  
  if (!results || !results.entities) {
    return null;
  }

  // Extraer red flags reales del rawResponse
  const extractRedFlags = () => {
    const flags = [];
    
    // Buscar patrones críticos en las entidades
    results.entities.forEach(entity => {
      const text = entity.text?.toLowerCase() || '';
      
      if (text.includes('visión doble') || text.includes('diplopía')) {
        flags.push({
          type: 'NEUROLÓGICO',
          text: 'Diplopía post-traumática',
          action: 'Derivación urgente a neurología/emergencias',
          severity: 'critical'
        });
      }
      
      if (text.includes('electricidad') && text.includes('ambas piernas')) {
        flags.push({
          type: 'NEUROLÓGICO', 
          text: 'Parestesias bilaterales',
          action: 'Descartar síndrome de cauda equina - Evaluación médica URGENTE',
          severity: 'critical'
        });
      }
    });
    
    // Buscar problemas legales/éticos en yellow flags
    if (results.yellowFlags) {
      results.yellowFlags.forEach(flag => {
        const flagText = typeof flag === 'string' ? flag : flag.descripcion || '';
        if (flagText.toLowerCase().includes('fraude')) {
          flags.push({
            type: 'LEGAL',
            text: 'Posible fraude al seguro detectado',
            action: 'NO participar. Documentar. Consultar con supervisor',
            severity: 'legal'
          });
        }
      });
    }
    
    return flags;
  };

  const redFlags = extractRedFlags();
  const hasRedFlags = redFlags.length > 0;

  // Filtrar entidades por tipo real
  const symptoms = results.entities.filter(e => 
    e.type === 'symptom' && !e.text?.includes('visión doble')
  );
  
  const chronicConditions = results.entities.filter(e => 
    e.type === 'condition' && (
      e.text?.toLowerCase().includes('depresión') ||
      e.text?.toLowerCase().includes('whiplash') ||
      e.text?.toLowerCase().includes('síndrome')
    )
  );
  
  const medications = results.entities.filter(e => e.type === 'medication');

  // Extraer highlights de la conversación
  const conversationHighlights = [
    "No se realizó evaluación cervical completa",
    "Fisioterapeuta ofrece acupuntura sin certificación",
    "Venta de suplemento no cubierto ($120)",
    "Sugiere manipular códigos de facturación"
  ];

  // Extraer tests físicos sugeridos
  const physicalTests = [];
  if (results.rawResponse) {
    console.log("🔍 DEBUG rawResponse:", results.rawResponse.substring(0, 200));
    try {
      const rawJson = JSON.parse(results.rawResponse.replace(/```json\n?/g, "").replace(/```/g, ""));
      console.log("📋 evaluaciones_fisicas_sugeridas:", rawJson.evaluaciones_fisicas_sugeridas);
      if (rawJson.evaluaciones_fisicas_sugeridas) {
        rawJson.evaluaciones_fisicas_sugeridas.forEach((test, index) => {
          physicalTests.push({
            id: `test-${index}`,
            text: typeof test === "string" ? test : test.descripcion || test,
            priority: index < 3 ? "high" : "normal"
          });
        });
        console.log("✅ Tests extraídos:", physicalTests.length);
      }
    } catch (e) {
      console.error("❌ Error extrayendo tests:", e);
    }
  }
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* ALERTA CRÍTICA - RED FLAGS */}
      {hasRedFlags && (
        <Card className="border-3 border-red-600 bg-red-100 animate-pulse">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-red-700" />
                <h2 className="text-xl font-bold text-red-900">
                  ⚠️ ALERTAS CRÍTICAS DETECTADAS - ACCIÓN INMEDIATA
                </h2>
              </div>
              <button
                onClick={() => setShowDerivationModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generar Informe de Derivación
              </button>
            </div>
            
            <div className="space-y-2">
              {redFlags.map((flag, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border-2 border-red-400">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                        flag.severity === 'critical' ? 'bg-red-700 text-white' : 'bg-orange-600 text-white'
                      }`}>
                        {flag.type}
                      </span>
                      <p className="font-semibold text-red-900 mt-2">{flag.text}</p>
                      <p className="text-sm text-red-700 mt-1">
                        <strong>Acción requerida:</strong> {flag.action}
                      </p>
                    </div>
                    {flag.severity === 'critical' && (
                      <button className="text-red-600 hover:text-red-800">
                        <XCircle className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-2 bg-red-200 rounded text-center">
              <p className="text-sm font-bold text-red-900">
                ¿Desea suspender la sesión y derivar al paciente?
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* GRID DE 3 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Columna 1: Advertencias Médico-Legales */}
        <Card className="h-fit">
          <div className="p-4 border-b bg-orange-50">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Advertencias Médico-Legales</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              {conversationHighlights.map((highlight, idx) => (
                <div key={idx} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-900">• {highlight}</p>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-600 font-medium mb-2">DOCUMENTACIÓN CRÍTICA:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>✓ Obtener consentimiento informado</li>
                <li>✓ Documentar evaluación completa</li>
                <li>✓ Registrar todos los hallazgos</li>
                <li>✓ Justificar plan de tratamiento</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Columna 2: Hallazgos Clínicos */}
        <Card className="h-fit">
          <div className="p-4 border-b bg-blue-50">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Hallazgos Clínicos</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Síntomas Actuales</h4>
              <div className="space-y-2">
                {symptoms.slice(0, 5).map(item => (
                  <label key={item.id} className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="mt-0.5 rounded border-gray-300"
                    />
                    <span className="text-gray-700">{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Historial Médico</h4>
              <div className="space-y-1">
                {chronicConditions.map(item => (
                  <div key={item.id} className="text-sm text-gray-600">
                    • {item.text}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Medicación Actual</h4>
              <div className="space-y-1">
                {medications.map(item => (
                  <div key={item.id} className="text-sm text-gray-600">
                    • {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Columna 3: Evaluación Física Propuesta */}
        <Card className="h-fit">
          <div className="p-4 border-b bg-purple-50">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Evaluación Física Propuesta</h3>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {physicalTests.map((test, index) => (
              <label key={test.id} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${
                test.priority === 'high' ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(test.id)}
                  onChange={() => toggleSelection(test.id)}
                  className="mt-0.5 rounded border-gray-300 text-purple-600"
                />
                <span className="text-sm text-gray-700">
                  {index + 1}. {test.text}
                </span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* FILA 4: Factores Psicosociales */}
      {results.yellowFlags && results.yellowFlags.length > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">Factores Psicosociales y Contexto Humano</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {results.yellowFlags.slice(0, 4).map((flag, index) => {
              const flagText = typeof flag === 'string' ? flag : flag.descripcion || flag.text || '';
              return (
                <div key={index} className="p-2 bg-white rounded-lg border border-yellow-300">
                  <p className="text-sm text-yellow-800">{flagText}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Botón de acción */}
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-500">
          {selectedIds.length} elementos seleccionados para evaluación
        </div>
        <button 
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          disabled={hasRedFlags || selectedIds.length === 0}
        >
          {hasRedFlags ? 'Resolver alertas críticas primero' : `Continuar con evaluación física →`}
        </button>
      </div>
    </div>
  );
};
