import React, { useState } from 'react';

import logger from '@/shared/utils/logger';

interface PainPoint {
  id: string;
  x: number;
  y: number;
  intensity: number; // 1-10
  description: string;
  side: 'front' | 'back' | 'left' | 'right';
}

interface ClinicalTest {
  id: string;
  name: string;
  category: string;
  description: string;
  isSelected: boolean;
  result?: string;
  evidence: 'high' | 'medium' | 'low';
}

export const HumanFigurePage: React.FC = () => {
  const [activeView, setActiveView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [selectedTests, setSelectedTests] = useState<ClinicalTest[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Tests clínicos disponibles
  const availableTests: ClinicalTest[] = [
    // Tests de Movilidad
    {
      id: 'ROM_CERVICAL',
      name: 'Rango de Movimiento Cervical',
      category: 'Movilidad',
      description: 'Evaluación de flexión, extensión, rotación y lateralización cervical',
      isSelected: false,
      evidence: 'high'
    },
    {
      id: 'ROM_LUMBAR',
      name: 'Rango de Movimiento Lumbar',
      category: 'Movilidad',
      description: 'Evaluación de flexión, extensión y rotación lumbar',
      isSelected: false,
      evidence: 'high'
    },
    {
      id: 'ROM_HOMBRO',
      name: 'Rango de Movimiento Hombro',
      category: 'Movilidad',
      description: 'Evaluación de abducción, flexión, rotación interna y externa',
      isSelected: false,
      evidence: 'high'
    },
    // Tests de Fuerza
    {
      id: 'FLEXION_CERVICAL',
      name: 'Fuerza Flexores Cervicales',
      category: 'Fuerza',
      description: 'Test de resistencia de flexores cervicales',
      isSelected: false,
      evidence: 'medium'
    },
    {
      id: 'EXTENSION_LUMBAR',
      name: 'Fuerza Extensores Lumbares',
      category: 'Fuerza',
      description: 'Test de resistencia de extensores lumbares',
      isSelected: false,
      evidence: 'medium'
    },
    // Tests Especiales
    {
      id: 'SLR',
      name: 'Straight Leg Raise (SLR)',
      category: 'Tests Especiales',
      description: 'Test de Lasegue para evaluación de ciática',
      isSelected: false,
      evidence: 'high'
    },
    {
      id: 'PATRICK',
      name: 'Test de Patrick/FABER',
      category: 'Tests Especiales',
      description: 'Test para evaluación de articulación sacroilíaca',
      isSelected: false,
      evidence: 'medium'
    },
    {
      id: 'NEER',
      name: 'Test de Neer',
      category: 'Tests Especiales',
      description: 'Test para síndrome de pinzamiento subacromial',
      isSelected: false,
      evidence: 'high'
    },
    {
      id: 'HAWKINS',
      name: 'Test de Hawkins-Kennedy',
      category: 'Tests Especiales',
      description: 'Test para síndrome de pinzamiento subacromial',
      isSelected: false,
      evidence: 'high'
    }
  ];

  const handleFigureClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newPainPoint: PainPoint = {
      id: `pain_${Date.now()}`,
      x,
      y,
      intensity: 5,
      description: prompt('Describa el dolor en esta área:') || 'Dolor localizado',
      side: activeView
    };

    setPainPoints([...painPoints, newPainPoint]);
  };

  const toggleTest = (testId: string) => {
    const test = availableTests.find(t => t.id === testId);
    if (!test) return;

    if (selectedTests.find(t => t.id === testId)) {
      setSelectedTests(selectedTests.filter(t => t.id !== testId));
    } else {
      setSelectedTests([...selectedTests, { ...test, isSelected: true }]);
    }
  };

  const updateTestResult = (testId: string, result: string) => {
    setSelectedTests(selectedTests.map(test => 
      test.id === testId ? { ...test, result } : test
    ));
  };

  const removePainPoint = (painId: string) => {
    setPainPoints(painPoints.filter(p => p.id !== painId));
  };

  const generateSOAP = () => {
    const painPointsText = painPoints.map(p => 
      `${p.description} (intensidad ${p.intensity}/10) en ${p.side}`
    ).join(', ');

    const testsText = selectedTests.map(t => 
      `${t.name}: ${t.result || 'No evaluado'}`
    ).join(', ');

    const soapData = {
      subjective: `Paciente refiere: ${painPointsText}`,
      objective: `Evaluación física: ${testsText}`,
      assessment: 'Diagnóstico preliminar basado en evaluación clínica',
      plan: 'Plan de tratamiento personalizado'
    };

    logger.info('Generando SOAP:', soapData);
    // Aquí se enviaría al sistema SOAP
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border" style={{ borderColor: '#BDC3C7' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
              Figura Humana - Mapa de Dolor
            </h1>
            <p className="text-sm mt-1" style={{ color: '#BDC3C7' }}>
              Evaluación visual y batería de tests clínicos
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDrawingMode 
                  ? 'bg-red-500 text-white' 
                  : 'bg-blue-500 text-white'
              }`}
            >
              {isDrawingMode ? 'Modo Visualización' : 'Modo Dibujo'}
            </button>
            <button
              onClick={generateSOAP}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Generar SOAP
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Panel Izquierdo - Figuras Humanas */}
        <div className="w-1/2 p-6 border-r" style={{ borderColor: '#BDC3C7' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            Figuras Humanas
          </h2>
          
          {/* Selector de Vista */}
          <div className="flex space-x-2 mb-4">
            {(['front', 'back', 'left', 'right'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === view
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {view === 'front' && 'Frente'}
                {view === 'back' && 'Espalda'}
                {view === 'left' && 'Izquierda'}
                {view === 'right' && 'Derecha'}
              </button>
            ))}
          </div>

          {/* Figura Humana */}
          <div className="relative bg-gray-50 rounded-lg border-2 border-dashed" style={{ borderColor: '#BDC3C7' }}>
            <div
              className="w-full h-96 cursor-crosshair"
              onClick={handleFigureClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  handleFigureClick(e as any);
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                backgroundImage: `url('/api/human-figure/${activeView}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Placeholder para figura humana */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-32 h-32 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <p className="text-sm" style={{ color: '#BDC3C7' }}>
                    Figura Humana - Vista {activeView === 'front' ? 'Frontal' : 
                    activeView === 'back' ? 'Posterior' : 
                    activeView === 'left' ? 'Lateral Izquierda' : 'Lateral Derecha'}
                  </p>
                  {isDrawingMode && (
                    <p className="text-xs mt-2" style={{ color: '#5DA5A3' }}>
                      Haz clic para marcar puntos de dolor
                    </p>
                  )}
                </div>
              </div>

              {/* Puntos de Dolor */}
              {painPoints
                .filter(p => p.side === activeView)
                .map((painPoint) => (
                  <div
                    key={painPoint.id}
                    className="absolute w-4 h-4 bg-red-500 rounded-full cursor-pointer transform -translate-x-2 -translate-y-2"
                    style={{
                      left: `${painPoint.x}%`,
                      top: `${painPoint.y}%`,
                      backgroundColor: `hsl(0, 100%, ${50 + painPoint.intensity * 5}%)`
                    }}
                    title={`${painPoint.description} (Intensidad: ${painPoint.intensity}/10)`}
                    onClick={() => removePainPoint(painPoint.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        removePainPoint(painPoint.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  />
                ))}
            </div>
          </div>

          {/* Paleta de Comandos */}
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border" style={{ borderColor: '#F59E0B' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
              Paleta de Comandos - Mapa de Dolor
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsDrawingMode(true)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  isDrawingMode 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-orange-600 border'
                }`}
                style={{ borderColor: '#F59E0B' }}
              >
                Dibujar
              </button>
              <button
                onClick={() => setPainPoints([])}
                className="px-3 py-1 rounded text-xs font-medium bg-white text-red-600 border"
                style={{ borderColor: '#E74C3C' }}
              >
                Limpiar
              </button>
              <button
                onClick={() => {
                  const intensity = prompt('Nueva intensidad (1-10):');
                  if (intensity) {
                    setPainPoints(painPoints.map(p => ({
                      ...p,
                      intensity: Math.min(10, Math.max(1, parseInt(intensity) || 5))
                    })));
                  }
                }}
                className="px-3 py-1 rounded text-xs font-medium bg-white text-blue-600 border"
                style={{ borderColor: '#3498DB' }}
              >
                Intensidad
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Batería de Tests */}
        <div className="w-1/2 p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#2C3E50' }}>
            Batería de Tests Clínicos
          </h2>
          
          {/* Tests Seleccionados */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3" style={{ color: '#2C3E50' }}>
              Tests Seleccionados ({selectedTests.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedTests.map((test) => (
                <div key={test.id} className="p-3 bg-blue-50 rounded-lg border" style={{ borderColor: '#3498DB' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>
                      {test.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      test.evidence === 'high' ? 'bg-green-100 text-green-800' :
                      test.evidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {test.evidence === 'high' ? 'Alta' : 
                       test.evidence === 'medium' ? 'Media' : 'Baja'} Evidencia
                    </span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#BDC3C7' }}>
                    {test.description}
                  </p>
                  <input
                    type="text"
                    placeholder="Resultado del test..."
                    value={test.result || ''}
                    onChange={(e) => updateTestResult(test.id, e.target.value)}
                    className="w-full px-2 py-1 text-xs border rounded"
                    style={{ borderColor: '#BDC3C7' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tests Disponibles */}
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: '#2C3E50' }}>
              Tests Disponibles
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableTests
                .filter(test => !selectedTests.find(t => t.id === test.id))
                .map((test) => (
                  <div key={test.id} className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors" style={{ borderColor: '#BDC3C7' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>
                        {test.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        test.evidence === 'high' ? 'bg-green-100 text-green-800' :
                        test.evidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.evidence === 'high' ? 'Alta' : 
                         test.evidence === 'medium' ? 'Media' : 'Baja'} Evidencia
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: '#BDC3C7' }}>
                      {test.description}
                    </p>
                    <button
                      onClick={() => toggleTest(test.id)}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Agregar Test
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Búsqueda Manual */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-sm font-medium mb-2" style={{ color: '#2C3E50' }}>
              Búsqueda Manual
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Buscar test específico..."
                className="flex-1 px-3 py-1 text-sm border rounded"
                style={{ borderColor: '#BDC3C7' }}
              />
              <button className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors">
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanFigurePage; 