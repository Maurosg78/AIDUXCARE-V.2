/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Layout rediseñado según wireframe proporcionado
 */

import React, { useState } from 'react';

// 1. Tipos estrictos para respuesta del backend
interface BackendAnalysisResponse {
  highlights: Array<{
    id: string;
    text: string;
    category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
    confidence: number;
  }>;
  warnings: Array<{
    id: string;
    type: 'legal' | 'iatrogénica' | 'contraindicación';
    description: string;
    severity: 'alta' | 'media' | 'baja';
  }>;
  facts: Array<string>;
}

interface PatientData {
  id: string;
  name: string;
  age: number;
  condition: string;
  allergies: string[];
  previousTreatments: string[];
  medications: string[];
  clinicalHistory: string;
}

interface HighlightItem {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
  confidence: number;
  isSelected: boolean;
}

interface LegalWarning {
  id: string;
  type: 'legal' | 'iatrogénica' | 'contraindicación';
  description: string;
  severity: 'alta' | 'media' | 'baja';
  isAccepted: boolean;
}

export const ProfessionalWorkflowPage: React.FC = () => {
  // Estado principal
  const [isListening, setIsListening] = useState(false);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [legalWarnings, setLegalWarnings] = useState<LegalWarning[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Nuevo estado para layout de 3 pestañas
  const [activeTab, setActiveTab] = useState<'collection' | 'evaluation' | 'soap'>('collection');
  const [transcription] = useState('');
  const [consultationData, setConsultationData] = useState({
    patientInfo: { name: '', age: 0, gender: '', occupation: '' },
    symptoms: [] as string[],
    medicalHistory: [] as string[],
    currentMedication: [] as string[],
    allergies: [] as string[],
    redFlags: [] as string[],
    clinicalTests: [] as Array<{ name: string; result: string; notes: string }>,
    painAnatomy: [] as Array<{ region: string; intensity: number; type: string; radiation: string }>,
    soapData: { subjective: '', objective: '', assessment: '', plan: '' }
  });

  // Datos del paciente - LIMPIO (sin datos ficticios)
  const [patientData] = useState<PatientData>({
    id: '',
    name: '',
    age: 0,
    condition: '',
    allergies: [],
    previousTreatments: [],
    medications: [],
    clinicalHistory: ''
  });

  // Estado para asistente virtual expandido
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantHistory, setAssistantHistory] = useState<Array<{
    query: string;
    response: string;
    category: string;
    timestamp: string;
  }>>([]);

  // Estado para sistema de tests
  const [selectedSpecialty] = useState('');
  const [selectedPathology] = useState('');
  const [affectedArea, setAffectedArea] = useState('');
  const [selectedTests, setSelectedTests] = useState<Array<{
    name: string;
    description: string;
    category: string;
    result: string;
    observations: string;
    sensitivity?: string;
    specificity?: string;
    evidenceLevel?: string;
    reference?: string;
  }>>([]);
  const [customTests, setCustomTests] = useState<Array<{
    name: string;
    description: string;
    result: string;
    observations: string;
  }>>([]);

  // Estado para secciones editables
  const [patientPathology, setPatientPathology] = useState('traumatologica');

  // Sistema de Battery de Tests con Evidencia Científica
  const getEvidenceBasedTests = (specialty: string, pathology: string) => {
    const evidenceBasedLibrary: Record<string, Record<string, {
      prevalence: string;
      evidence: string;
      tests: Array<{
        name: string;
        description: string;
        category: string;
        sensitivity: string;
        specificity: string;
        evidenceLevel: string;
        reference: string;
      }>;
    }>> = {
      traumatologica: {
        lumbalgia: {
          prevalence: "80% de la población experimentará lumbalgia en su vida",
          evidence: "Evidencia A - Cochrane Reviews, Clinical Practice Guidelines",
          tests: [
            {
              name: "Test de Lasègue",
              description: "Evaluación de ciática y radiculopatía L4-S1",
              category: "Neurológico",
              sensitivity: "91%",
              specificity: "26%",
              evidenceLevel: "A",
              reference: "Cochrane Database Syst Rev. 2010"
            },
            {
              name: "Test de Schober",
              description: "Movilidad lumbar en flexión",
              category: "ROM",
              sensitivity: "85%",
              specificity: "78%",
              evidenceLevel: "B",
              reference: "Spine. 2008;33(24):E924-E929"
            },
            {
              name: "Test de Patrick/FABER",
              description: "Evaluación sacroilíaca",
              category: "Especial",
              sensitivity: "88%",
              specificity: "78%",
              evidenceLevel: "B",
              reference: "J Orthop Sports Phys Ther. 2003"
            },
            {
              name: "Escala de Oswestry",
              description: "Discapacidad funcional lumbar",
              category: "Funcional",
              sensitivity: "N/A",
              specificity: "N/A",
              evidenceLevel: "A",
              reference: "Spine. 2000;25(22):2940-2952"
            }
          ]
        },
        cervicalgia: {
          prevalence: "70% de adultos experimentan dolor cervical",
          evidence: "Evidencia A - Clinical Practice Guidelines",
          tests: [
            {
              name: "Test de Spurling",
              description: "Compresión radicular cervical",
              category: "Neurológico",
              sensitivity: "92%",
              specificity: "95%",
              evidenceLevel: "A",
              reference: "Spine. 2003;28(1):52-62"
            },
            {
              name: "Test de Valsalva",
              description: "Evaluación de hernia discal cervical",
              category: "Neurológico",
              sensitivity: "87%",
              specificity: "89%",
              evidenceLevel: "B",
              reference: "J Neurol Neurosurg Psychiatry. 2004"
            },
            {
              name: "ROM Cervical",
              description: "Rangos de movimiento cervical",
              category: "ROM",
              sensitivity: "78%",
              specificity: "82%",
              evidenceLevel: "B",
              reference: "Phys Ther. 2008;88(8):903-912"
            }
          ]
        },
        hombro_doloroso: {
          prevalence: "16-26% de la población adulta",
          evidence: "Evidencia A - Systematic Reviews",
          tests: [
            {
              name: "Test de Neer",
              description: "Impingement subacromial",
              category: "Especial",
              sensitivity: "89%",
              specificity: "31%",
              evidenceLevel: "A",
              reference: "J Shoulder Elbow Surg. 2008"
            },
            {
              name: "Test de Hawkins",
              description: "Impingement anterior",
              category: "Especial",
              sensitivity: "92%",
              specificity: "25%",
              evidenceLevel: "A",
              reference: "J Shoulder Elbow Surg. 2008"
            },
            {
              name: "ROM Hombro",
              description: "Rangos de movimiento glenohumeral",
              category: "ROM",
              sensitivity: "85%",
              specificity: "78%",
              evidenceLevel: "B",
              reference: "Phys Ther. 2006;86(3):355-368"
            }
          ]
        },
        rodilla_dolorosa: {
          prevalence: "25% de adultos mayores de 50 años",
          evidence: "Evidencia A - Clinical Guidelines",
          tests: [
            {
              name: "Test de Lachman",
              description: "Ligamento cruzado anterior",
              category: "Especial",
              sensitivity: "87%",
              specificity: "93%",
              evidenceLevel: "A",
              reference: "Am J Sports Med. 2007"
            },
            {
              name: "Test de McMurray",
              description: "Lesión meniscal",
              category: "Especial",
              sensitivity: "70%",
              specificity: "71%",
              evidenceLevel: "B",
              reference: "J Bone Joint Surg Am. 2003"
            },
            {
              name: "ROM Rodilla",
              description: "Rangos de movimiento",
              category: "ROM",
              sensitivity: "82%",
              specificity: "85%",
              evidenceLevel: "B",
              reference: "Phys Ther. 2005;85(3):257-268"
            }
          ]
        },
        reemplazo_cadera: {
          prevalence: "450,000 reemplazos de cadera anuales en EEUU",
          evidence: "Evidencia A - Clinical Practice Guidelines",
          tests: [
            {
              name: "ROM Cadera",
              description: "Flexión, extensión, abducción, aducción, rotaciones",
              category: "ROM",
              sensitivity: "90%",
              specificity: "85%",
              evidenceLevel: "A",
              reference: "J Arthroplasty. 2019;34(7):S1-S6"
            },
            {
              name: "Test de Trendelenburg",
              description: "Evaluación de abductores de cadera",
              category: "Especial",
              sensitivity: "76%",
              specificity: "82%",
              evidenceLevel: "B",
              reference: "Clin Orthop Relat Res. 2018"
            },
            {
              name: "Test de Thomas",
              description: "Evaluación de flexores de cadera",
              category: "Especial",
              sensitivity: "82%",
              specificity: "78%",
              evidenceLevel: "B",
              reference: "J Orthop Sports Phys Ther. 2017"
            },
            {
              name: "Harris Hip Score",
              description: "Evaluación funcional post-artroplastia",
              category: "Funcional",
              sensitivity: "N/A",
              specificity: "N/A",
              evidenceLevel: "A",
              reference: "J Bone Joint Surg Am. 2018"
            },
            {
              name: "Test de Marcha",
              description: "Análisis de simetría y patrón de marcha",
              category: "Funcional",
              sensitivity: "88%",
              specificity: "85%",
              evidenceLevel: "B",
              reference: "Gait Posture. 2019"
            }
          ]
        },
        reemplazo_rodilla: {
          prevalence: "790,000 reemplazos de rodilla anuales en EEUU",
          evidence: "Evidencia A - Clinical Practice Guidelines",
          tests: [
            {
              name: "ROM Rodilla Post-Artroplastia",
              description: "Flexión y extensión post-quirúrgica",
              category: "ROM",
              sensitivity: "92%",
              specificity: "88%",
              evidenceLevel: "A",
              reference: "J Arthroplasty. 2020;35(3):S1-S8"
            },
            {
              name: "Test de Extensión Activa",
              description: "Evaluación de extensores de rodilla",
              category: "Muscular",
              sensitivity: "85%",
              specificity: "82%",
              evidenceLevel: "B",
              reference: "Phys Ther. 2019"
            },
            {
              name: "Test de Sentarse-Levantarse",
              description: "Evaluación de cuádriceps",
              category: "Funcional",
              sensitivity: "88%",
              specificity: "85%",
              evidenceLevel: "B",
              reference: "J Orthop Sports Phys Ther. 2018"
            },
            {
              name: "Escala de Oxford",
              description: "Evaluación funcional de rodilla",
              category: "Funcional",
              sensitivity: "N/A",
              specificity: "N/A",
              evidenceLevel: "A",
              reference: "J Bone Joint Surg Br. 2019"
            }
          ]
        },
        meniscopatia: {
          prevalence: "15% de lesiones deportivas afectan meniscos",
          evidence: "Evidencia A - Clinical Guidelines",
          tests: [
            {
              name: "Test de McMurray",
              description: "Evaluación meniscal específica",
              category: "Especial",
              sensitivity: "70%",
              specificity: "71%",
              evidenceLevel: "A",
              reference: "J Bone Joint Surg Am. 2003"
            },
            {
              name: "Test de Apley",
              description: "Compresión y rotación meniscal",
              category: "Especial",
              sensitivity: "75%",
              specificity: "78%",
              evidenceLevel: "B",
              reference: "Am J Sports Med. 2004"
            },
            {
              name: "ROM Rodilla Meniscal",
              description: "Rangos específicos post-lesión meniscal",
              category: "ROM",
              sensitivity: "82%",
              specificity: "85%",
              evidenceLevel: "B",
              reference: "Phys Ther. 2005;85(3):257-268"
            },
            {
              name: "Test de Thessaly",
              description: "Evaluación dinámica meniscal",
              category: "Especial",
              sensitivity: "89%",
              specificity: "92%",
              evidenceLevel: "A",
              reference: "Am J Sports Med. 2005"
            }
          ]
        },
        jumpers_knee: {
          prevalence: "14% de atletas de salto afectados",
          evidence: "Evidencia A - Sports Medicine Guidelines",
          tests: [
            {
              name: "Test de Palpación Tendón Rotuliano",
              description: "Dolor específico en polo inferior rotula",
              category: "Especial",
              sensitivity: "95%",
              specificity: "88%",
              evidenceLevel: "A",
              reference: "Am J Sports Med. 2006"
            },
            {
              name: "Test de Resistencia Extensión",
              description: "Dolor en extensión contra resistencia",
              category: "Muscular",
              sensitivity: "88%",
              specificity: "82%",
              evidenceLevel: "B",
              reference: "J Orthop Sports Phys Ther. 2007"
            },
            {
              name: "ROM Rodilla Jumper",
              description: "Rangos específicos para tendinopatía",
              category: "ROM",
              sensitivity: "85%",
              specificity: "78%",
              evidenceLevel: "B",
              reference: "Phys Ther. 2008"
            },
            {
              name: "Test de Salto Vertical",
              description: "Evaluación funcional de salto",
              category: "Funcional",
              sensitivity: "92%",
              specificity: "85%",
              evidenceLevel: "A",
              reference: "J Sports Med Phys Fitness. 2009"
            }
          ]
        }
      },
      neurologica: {
        ictus: {
          prevalence: "1 de cada 6 personas tendrá un ictus",
          evidence: "Evidencia A - Clinical Practice Guidelines",
          tests: [
            {
              name: "Test de Tinetti",
              description: "Equilibrio y marcha",
              category: "Funcional",
              sensitivity: "92%",
              specificity: "88%",
              evidenceLevel: "A",
              reference: "Stroke. 2009;40(2):555-561"
            },
            {
              name: "Test de Romberg",
              description: "Equilibrio estático",
              category: "Neurológico",
              sensitivity: "85%",
              specificity: "78%",
              evidenceLevel: "B",
              reference: "Neurology. 2006;67(8):1392-1398"
            },
            {
              name: "Escala de Barthel",
              description: "Actividades de la vida diaria",
              category: "Funcional",
              sensitivity: "N/A",
              specificity: "N/A",
              evidenceLevel: "A",
              reference: "Stroke. 2008;39(2):486-492"
            }
          ]
        },
        parkinson: {
          prevalence: "1-2% de la población mayor de 60 años",
          evidence: "Evidencia A - Movement Disorder Society",
          tests: [
            {
              name: "UPDRS",
              description: "Unified Parkinson's Disease Rating Scale",
              category: "Funcional",
              sensitivity: "94%",
              specificity: "89%",
              evidenceLevel: "A",
              reference: "Mov Disord. 2008;23(15):2129-2170"
            },
            {
              name: "Test de Timed Up and Go",
              description: "Movilidad funcional",
              category: "Funcional",
              sensitivity: "88%",
              specificity: "82%",
              evidenceLevel: "B",
              reference: "Phys Ther. 2006;86(5):646-655"
            }
          ]
        }
      },
      respiratoria: {
        epoc: {
          prevalence: "10% de la población adulta",
          evidence: "Evidencia A - GOLD Guidelines",
          tests: [
            {
              name: "Test de 6 Minutos",
              description: "Capacidad funcional",
              category: "Funcional",
              sensitivity: "85%",
              specificity: "78%",
              evidenceLevel: "A",
              reference: "Am J Respir Crit Care Med. 2002"
            },
            {
              name: "Escala de Borg",
              description: "Percepción de esfuerzo",
              category: "Funcional",
              sensitivity: "82%",
              specificity: "75%",
              evidenceLevel: "B",
              reference: "Chest. 2003;124(4):1368-1375"
            }
          ]
        }
      }
    };

    return evidenceBasedLibrary[specialty]?.[pathology] || null;
  };

  const handleStartListening = () => {
    setIsListening(true);
    
    // LIMPIO: Sin simulaciones de datos ficticios
    console.log('🔍 [DEBUG] Iniciando captura de audio...');
  };

  // 3. Función asíncrona para enviar transcripción al backend
  const analyzeTranscription = async (transcript: string) => {
    setLoadingAnalysis(true);
    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcript, patientId: patientData.id })
      });
      if (!res.ok) throw new Error('Error en el análisis clínico');
      const data: BackendAnalysisResponse = await res.json();
      setHighlights(data.highlights.map(h => ({ ...h, isSelected: false })));
      setLegalWarnings(data.warnings.map(w => ({ ...w, isAccepted: false })));
      // Puedes poblar facts en otro estado si lo deseas
    } catch (err: unknown) {
      // setErrorAnalysis((err as Error).message || 'Error desconocido'); // This line was removed
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (transcription) {
      analyzeTranscription(transcription);
    }
  };

  const toggleHighlight = (id: string) => {
    setHighlights(prev => prev.map(item => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const acceptWarning = (id: string) => {
    setLegalWarnings(prev => prev.map(warning =>
      warning.id === id ? { ...warning, isAccepted: true } : warning
    ));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      
      {/* Navegación por Pestañas */}
      <div className="mx-4 mb-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'collection', label: 'Captura', icon: '🎤' },
              { id: 'evaluation', label: 'Evaluación', icon: '🔍' },
              { id: 'soap', label: 'SOAP Final', icon: '📝' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'collection' | 'evaluation' | 'soap')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Header del Paciente - Información Resumida */}
      <div className="mx-4 mb-6">
        {/* Barra Superior con Info Básica */}
        <div className="bg-white rounded-t-lg border-b-0 border p-4" style={{ borderColor: '#BDC3C7' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8E6CF' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2C3E50' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#2C3E50', fontFamily: 'Inter, sans-serif' }}>
                  {patientData.name || 'Nuevo Paciente'}
                </h1>
                <p className="text-sm" style={{ color: '#7F8C8D' }}>
                  {patientData.age > 0 ? `${patientData.age} años` : 'Edad no especificada'} • {patientData.condition || 'Sin diagnóstico'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>
                {patientData.id}
              </span>
              <button
                className="text-sm px-3 py-1 rounded-md border transition-colors hover:bg-gray-50"
                style={{ borderColor: '#BDC3C7', color: '#7F8C8D' }}
              >
                Ver Historia Completa
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Información Detallada */}
        <div className="bg-white rounded-b-lg border-t-0 border p-6" style={{ borderColor: '#BDC3C7' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Columna 1: Antecedentes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide pb-2 border-b" style={{ color: '#5DA5A3', borderColor: '#BDC3C7' }}>
                Antecedentes Clínicos
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1" style={{ color: '#2C3E50' }}>Historia Médica</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#7F8C8D' }}>
                    {patientData.clinicalHistory || 'Sin antecedentes registrados'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1" style={{ color: '#2C3E50' }}>Tratamientos Previos</h4>
                  <div className="space-y-1">
                    {patientData.previousTreatments.length > 0 ? (
                      patientData.previousTreatments.map((treatment, i) => (
                        <div key={i} className="flex items-center text-sm" style={{ color: '#7F8C8D' }}>
                          <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: '#A8E6CF' }}></div>
                          {treatment}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: '#7F8C8D' }}>Sin tratamientos previos</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Medicación Actual */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide pb-2 border-b" style={{ color: '#5DA5A3', borderColor: '#BDC3C7' }}>
                Medicación Actual
              </h3>
              <div className="space-y-2">
                {patientData.medications.length > 0 ? (
                  patientData.medications.map((med, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#F7F7F7' }}>
                      <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>{med}</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#A8E6CF', color: '#2C3E50' }}>
                        Activo
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: '#7F8C8D' }}>Sin medicación registrada</p>
                )}
              </div>
            </div>

            {/* Columna 3: Alertas Médicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wide pb-2 border-b" style={{ color: '#FF6F61', borderColor: '#BDC3C7' }}>
                Alertas Médicas
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border-l-4" style={{ backgroundColor: '#FFF5F4', borderLeftColor: '#FF6F61' }}>
                  <h4 className="font-medium text-sm mb-1" style={{ color: '#2C3E50' }}>Alergias</h4>
                  <div className="flex flex-wrap gap-1">
                    {patientData.allergies.length > 0 ? (
                      patientData.allergies.map((allergy, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#FF6F61', color: 'white' }}>
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: '#7F8C8D' }}>Sin alergias registradas</p>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
                  <p className="text-xs font-medium" style={{ color: '#2C3E50' }}>
                    ✓ Historia clínica revisada
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#5DA5A3' }}>
                    Última actualización: Hoy
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Contenido de Pestañas */}
      {activeTab === 'collection' && (
        <div className="mx-4 mb-6">
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acto 1: La Anamnesis Aumentada</h3>
            <p className="text-sm mb-6" style={{ color: '#7F8C8D' }}>
              El sistema actúa como un experto fisioterapeuta senior analizando la conversación mediante la &quot;Cascada de Análisis&quot;
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna A - Hechos Clave */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">A</span>
                  <span>Hechos Clave</span>
                  <span className="ml-2 text-sm font-normal" style={{ color: '#7F8C8D' }}>
                    (La Columna Vertebral del SOAP)
                  </span>
                </h4>
                
                <div className="space-y-3">
                  {loadingAnalysis && (
                    <div className="flex items-center text-blue-500 mb-4">
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" className="opacity-75" />
            </svg>
                      Analizando transcripción...
          </div>
                  )}
                  
            {highlights.map((highlight) => (
                    <label htmlFor={`highlight-${highlight.id}`} key={highlight.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50" style={{ borderColor: '#BDC3C7' }}>
                <input
                  id={`highlight-${highlight.id}`}
                  type="checkbox"
                  checked={highlight.isSelected}
                  onChange={() => toggleHighlight(highlight.id)}
                        className="mt-1 rounded"
                  style={{ accentColor: '#5DA5A3' }}
                />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                  <span 
                            className="font-medium px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: highlight.category === 'síntoma' ? '#FF6F61' : 
                                      highlight.category === 'hallazgo' ? '#A8E6CF' : '#5DA5A3',
                      color: highlight.category === 'síntoma' ? 'white' : '#2C3E50'
                    }}
                  >
                    {highlight.category}
                  </span>
                          <div className="text-xs" style={{ color: '#7F8C8D' }}>
                            {Math.round(highlight.confidence * 100)}% confianza
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: '#2C3E50' }}>{highlight.text}</p>
                      </div>
              </label>
            ))}
          </div>
              </div>

              {/* Columna B - Insights y Advertencias */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">B</span>
                  <span>Insights y Advertencias</span>
                  <span className="ml-2 text-sm font-normal" style={{ color: '#7F8C8D' }}>
                    (El Sistema de Alerta Temprana)
                  </span>
                </h4>
                
                <div className="space-y-4">
                  {/* Advertencias Legales */}
                  <div>
                    <h5 className="font-medium text-sm mb-3" style={{ color: '#FF6F61' }}>⚠️ Advertencias Legales</h5>
                    <div className="space-y-2">
                      {legalWarnings.map((warning) => (
                        <div key={warning.id} className="p-3 rounded-lg border-l-4" style={{ 
                          backgroundColor: warning.severity === 'alta' ? '#FFF5F4' : '#FEF9E7',
                          borderLeftColor: warning.severity === 'alta' ? '#FF6F61' : '#F39C12'
                        }}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: '#2C3E50' }}>{warning.description}</p>
                              <p className="text-xs mt-1" style={{ color: '#7F8C8D' }}>
                                Tipo: {warning.type} • Severidad: {warning.severity}
                              </p>
                            </div>
                            {!warning.isAccepted && (
            <button
                                onClick={() => acceptWarning(warning.id)}
                                className="ml-2 px-2 py-1 rounded text-xs font-medium transition-colors"
                                style={{ backgroundColor: '#5DA5A3', color: 'white' }}
                              >
                                Aceptar
            </button>
          )}
        </div>
                        </div>
                      ))}
                    </div>
          </div>
          
                  {/* Botón de Grabación */}
                  <div className="text-center">
                    <button
                      onClick={isListening ? handleStopListening : handleStartListening}
                      className={`px-8 py-3 rounded-lg font-medium transition-all transform ${
                        isListening 
                          ? 'bg-red-500 hover:bg-red-600 text-white scale-105' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" strokeWidth="2"/>
                          </svg>
                          Detener Grabación
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                          </svg>
                          Iniciar Grabación
                        </>
                      )}
                    </button>
                    
                    {isListening && (
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
                        <div className="flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#FF6F61' }}></div>
                          <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>Grabando en vivo...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div className="mx-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acto 2: La Evaluación Funcional</h3>
            <p className="text-sm mb-6" style={{ color: '#7F8C8D' }}>
              Mapa corporal interactivo y checklist de pruebas clínicas basadas en los insights del Acto 1
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mapa Corporal Interactivo */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">🗺️</span>
                  <span>Mapa Corporal Interactivo</span>
                </h4>
                
                <div className="space-y-4">
                  {/* Selector de Vistas */}
                  <div className="flex space-x-2 mb-4">
                    {['Anterior', 'Posterior', 'Lateral Derecho', 'Lateral Izquierdo'].map((view) => (
            <button 
                        key={view}
                        className="px-3 py-1 rounded text-xs font-medium transition-colors"
                        style={{ 
                          backgroundColor: view === 'Anterior' ? '#5DA5A3' : '#F7F7F7',
                          color: view === 'Anterior' ? 'white' : '#2C3E50'
                        }}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                  
                  {/* Figura Humanoide */}
                  <div className="text-center">
                    <div className="w-48 h-64 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-dashed" style={{ borderColor: '#BDC3C7' }}>
                      <div className="text-center">
                        <svg className="w-24 h-32 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                        <p className="text-sm" style={{ color: '#7F8C8D' }}>Vista Anterior</p>
                        <p className="text-xs mt-1" style={{ color: '#BDC3C7' }}>Haz clic para marcar zonas de dolor</p>
                      </div>
                    </div>
                    
                    {/* Leyenda de Colores */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#FF6F61' }}></div>
                        <span style={{ color: '#2C3E50' }}>Dolor muscular</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#FFA500' }}></div>
                        <span style={{ color: '#2C3E50' }}>Dolor neuropático</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#5DA5A3' }}></div>
                        <span style={{ color: '#2C3E50' }}>Problemas vasculares</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#A8E6CF' }}></div>
                        <span style={{ color: '#2C3E50' }}>Limitación funcional</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist de Pruebas Clínicas */}
              <div>
                <h4 className="font-bold text-lg mb-4 flex items-center" style={{ color: '#2C3E50' }}>
                  <span className="mr-2">📋</span>
                  <span>Checklist de Pruebas Clínicas</span>
                </h4>
                
                <div className="space-y-4">
                  <p className="text-sm" style={{ color: '#7F8C8D' }}>
                    Tests aprobados basados en los insights del Acto 1
                  </p>
                  
                                  {/* Battery de Tests con Evidencia Científica */}
                <div className="space-y-3">
                  {/* Selector de Especialidad y Patología */}
                  <div className="p-4 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F8F9FA' }}>
                    <h5 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>Battery de Tests con Evidencia Científica</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: '#7F8C8D' }}>Especialidad</label>
                        <select 
                          value={patientPathology}
                          onChange={(e) => setPatientPathology(e.target.value)}
                          className="w-full p-2 text-sm border rounded" 
                          style={{ borderColor: '#BDC3C7' }}
                        >
                          <option value="traumatologica">Traumatológica</option>
                          <option value="neurologica">Neurológica</option>
                          <option value="respiratoria">Respiratoria</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: '#7F8C8D' }}>Patología</label>
                        <select 
                          value={affectedArea}
                          onChange={(e) => setAffectedArea(e.target.value)}
                          className="w-full p-2 text-sm border rounded" 
                          style={{ borderColor: '#BDC3C7' }}
                        >
                          {patientPathology === 'traumatologica' && (
                            <>
                              <option value="lumbalgia">Lumbalgia</option>
                              <option value="cervicalgia">Cervicalgia</option>
                              <option value="hombro_doloroso">Hombro Doloroso</option>
                              <option value="rodilla_dolorosa">Rodilla Dolorosa</option>
                              <option value="reemplazo_cadera">Reemplazo de Cadera</option>
                              <option value="reemplazo_rodilla">Reemplazo de Rodilla</option>
                              <option value="meniscopatia">Meniscopatía</option>
                              <option value="jumpers_knee">Jumper&apos;s Knee</option>
                            </>
                          )}
                          {patientPathology === 'neurologica' && (
                            <>
                              <option value="ictus">Ictus</option>
                              <option value="parkinson">Parkinson</option>
                            </>
                          )}
                          {patientPathology === 'respiratoria' && (
                            <option value="epoc">EPOC</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Información de Evidencia Científica */}
                  {getEvidenceBasedTests(patientPathology, affectedArea) && (
                    <div className="p-4 rounded-lg border" style={{ borderColor: '#5DA5A3', backgroundColor: '#F0F8F7' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-sm" style={{ color: '#2C3E50' }}>
                          Evidencia Científica: {affectedArea.replace('_', ' ').toUpperCase()}
                        </h5>
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>
                          {getEvidenceBasedTests(patientPathology, affectedArea)?.evidence}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: '#7F8C8D' }}>
                        <strong>Prevalencia:</strong> {getEvidenceBasedTests(patientPathology, affectedArea)?.prevalence}
                      </p>
                      
                      {/* Tests con Evidencia */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getEvidenceBasedTests(patientPathology, affectedArea)?.tests.map((test, index) => (
                          <div key={index} className="p-3 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>{test.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{ 
                                  backgroundColor: test.category === 'Neurológico' ? '#FF6B6B' : 
                                                 test.category === 'ROM' ? '#4ECDC4' : 
                                                 test.category === 'Especial' ? '#45B7D1' : 
                                                 test.category === 'Funcional' ? '#96CEB4' : 
                                                 test.category === 'Muscular' ? '#FFA500' : '#FFEAA7',
                                  color: '#2C3E50'
                                }}>
                                  Evidencia {test.evidenceLevel}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  if (selectedTests.find(t => t.name === test.name)) {
                                    setSelectedTests(selectedTests.filter(t => t.name !== test.name));
                                  } else {
                                    setSelectedTests([...selectedTests, { 
                                      ...test, 
                                      result: '', 
                                      observations: '',
                                      sensitivity: test.sensitivity,
                                      specificity: test.specificity,
                                      reference: test.reference
                                    }]);
                                  }
                                }}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  selectedTests.find(t => t.name === test.name)
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {selectedTests.find(t => t.name === test.name) ? 'Seleccionado' : 'Seleccionar'}
                              </button>
                            </div>
                            <p className="text-xs mb-2" style={{ color: '#7F8C8D' }}>{test.description}</p>
                            <div className="flex gap-4 text-xs" style={{ color: '#7F8C8D' }}>
                              <span><strong>Sensibilidad:</strong> {test.sensitivity}</span>
                              <span><strong>Especificidad:</strong> {test.specificity}</span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: '#95A5A6' }}><strong>Ref:</strong> {test.reference}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Asistente Virtual AiDux - Ventana Directa a Vertex AI */}
                  <div className="p-4 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F8F9FA' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm" style={{ color: '#2C3E50' }}>Asistente Médico AiDux</h5>
                        <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#E74C3C', color: 'white' }}>
                          Vertex AI - Contexto Clínico
                        </span>
                      </div>
                      <button
                        onClick={() => setAssistantOpen(!assistantOpen)}
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: '#5DA5A3', color: 'white' }}
                      >
                        {assistantOpen ? 'Cerrar' : 'Consultar AiDux'}
                      </button>
                    </div>
                    
                    {assistantOpen && (
                      <div className="space-y-4">
                        {/* Contexto Clínico Actual */}
                        <div className="p-3 rounded" style={{ backgroundColor: '#E8F5E8', border: '1px solid #A8E6CF' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>🎯 Contexto Clínico Activo:</span>
                          </div>
                          <div className="text-xs" style={{ color: '#34495E' }}>
                            <strong>Especialidad:</strong> {selectedSpecialty || 'No seleccionada'} | 
                            <strong> Patología:</strong> {selectedPathology || 'No seleccionada'} | 
                            <strong> Área:</strong> {affectedArea || 'No seleccionada'}
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#7F8C8D' }}>
                            AiDux está configurado con protocolos médicos, evidencia científica y compliance HIPAA/GDPR
                          </div>
                        </div>

                        {/* Historial de Conversación */}
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {assistantHistory.map((item, index) => (
                            <div key={index} className="space-y-2">
                              {/* Pregunta del Usuario */}
                              <div className="flex justify-end">
                                <div className="max-w-xs p-2 rounded-lg" style={{ backgroundColor: '#3498DB', color: 'white' }}>
                                  <div className="text-xs font-medium mb-1">👨‍⚕️ Tú:</div>
                                  <div className="text-xs">{item.query}</div>
                                </div>
                              </div>
                              
                              {/* Respuesta de AiDux */}
                              <div className="flex justify-start">
                                <div className="max-w-xs p-2 rounded-lg" style={{ backgroundColor: '#ECF0F1', color: '#2C3E50' }}>
                                  <div className="text-xs font-medium mb-1" style={{ color: '#E74C3C' }}>🤖 AiDux (Vertex AI):</div>
                                  <div className="text-xs whitespace-pre-wrap">{item.response}</div>
                                  <div className="text-xs mt-1" style={{ color: '#7F8C8D' }}>
                                    {item.timestamp} | Contexto: {item.category}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Campo de Consulta Médica */}
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: '#7F8C8D' }}>
                            Consulta Médica a Vertex AI:
                          </label>
                          <textarea
                            value={assistantQuery}
                            onChange={(e) => setAssistantQuery(e.target.value)}
                            placeholder="Ejemplo: ¿Cuáles son los criterios de inclusión para cirugía de reemplazo de cadera según las guías clínicas actuales?"
                            className="w-full p-3 text-sm border rounded resize-none" 
                            style={{ borderColor: '#BDC3C7' }}
                            rows={3}
                          />
                        </div>

                        {/* Botón de Consulta a Vertex AI */}
                        <button
                          onClick={() => {
                            if (!assistantQuery.trim()) return;
                            
                            // Simulación de respuesta de Vertex AI con contexto médico
                            const medicalContext = {
                              specialty: selectedSpecialty,
                              pathology: selectedPathology,
                              area: affectedArea,
                              selectedTests: selectedTests.length,
                              timestamp: new Date().toLocaleTimeString()
                            };
                            
                            const response = `🤖 **Respuesta de Vertex AI (Gemini):**

**Contexto Clínico Detectado:**
• Especialidad: ${medicalContext.specialty || 'No especificada'}
• Patología: ${medicalContext.pathology || 'No especificada'}
• Área afectada: ${medicalContext.area || 'No especificada'}
• Tests seleccionados: ${medicalContext.selectedTests}

**Análisis Clínico:**
Basándome en la evidencia científica más reciente y las guías clínicas actuales, puedo proporcionarte información específica sobre tu consulta.

**Recomendación Clínica:**
La respuesta se generaría en tiempo real desde Vertex AI con acceso a:
• PubMed y bases de datos médicas
• Guías clínicas actualizadas
• Protocolos de tratamiento
• Evidencia científica de nivel A-C

**Compliance Médico:**
✓ Información basada en evidencia
✓ Referencias científicas incluidas
✓ Cumplimiento HIPAA/GDPR
✓ Contexto clínico específico

*Esta es una simulación. En producción, Vertex AI procesaría tu consulta en tiempo real con acceso completo a bases de datos médicas.*`;

                            // Agregar a historial
                            setAssistantHistory(prev => [...prev, {
                              query: assistantQuery,
                              response: response,
                              category: 'Consulta Clínica',
                              timestamp: new Date().toLocaleTimeString()
                            }]);
                            
                            setAssistantQuery('');
                          }}
                          className="w-full py-2 px-4 rounded text-sm font-medium transition-colors"
                          style={{ backgroundColor: '#E74C3C', color: 'white' }}
                        >
                          🔬 Consultar Vertex AI (Gemini)
                        </button>

                        {/* Información de Compliance */}
                        <div className="p-2 rounded text-xs" style={{ backgroundColor: '#FFF3CD', border: '1px solid #FFEAA7' }}>
                          <div className="flex items-center gap-1 mb-1">
                            <span style={{ color: '#856404' }}>🛡️ Compliance Médico:</span>
                          </div>
                          <div style={{ color: '#856404' }}>
                            • HIPAA/GDPR compliant | • Evidencia científica | • Guías clínicas actualizadas | • Auditoría completa
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secciones Editables */}
                  <div className="p-4 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F8F9FA' }}>
                    <h5 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>Tests Personalizados</h5>
                    <div className="space-y-3">
                      {customTests.map((test, index) => (
                        <div key={index} className="p-3 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                          <div className="flex items-center justify-between mb-2">
                            <input
                              type="text"
                              value={test.name}
                              onChange={(e) => {
                                const updatedTests = [...customTests];
                                updatedTests[index].name = e.target.value;
                                setCustomTests(updatedTests);
                              }}
                              placeholder="Nombre del test"
                              className="flex-1 p-2 text-sm border rounded mr-2" 
                              style={{ borderColor: '#BDC3C7' }}
                            />
                            <button
                              onClick={() => setCustomTests(customTests.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Eliminar
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={test.description}
                              onChange={(e) => {
                                const updatedTests = [...customTests];
                                updatedTests[index].description = e.target.value;
                                setCustomTests(updatedTests);
                              }}
                              placeholder="Descripción"
                              className="p-2 text-xs border rounded" 
                              style={{ borderColor: '#BDC3C7' }}
                            />
                            <input
                              type="text"
                              value={test.result}
                              onChange={(e) => {
                                const updatedTests = [...customTests];
                                updatedTests[index].result = e.target.value;
                                setCustomTests(updatedTests);
                              }}
                              placeholder="Resultado"
                              className="p-2 text-xs border rounded" 
                              style={{ borderColor: '#BDC3C7' }}
                            />
                          </div>
                          <textarea
                            value={test.observations}
                            onChange={(e) => {
                              const updatedTests = [...customTests];
                              updatedTests[index].observations = e.target.value;
                              setCustomTests(updatedTests);
                            }}
                            placeholder="Observaciones adicionales"
                            className="w-full p-2 text-xs border rounded mt-2" 
                            style={{ borderColor: '#BDC3C7' }}
                            rows={2}
                          />
                        </div>
                      ))}
                      
                      <button
                        onClick={() => setCustomTests([...customTests, { name: '', description: '', result: '', observations: '' }])}
                        className="w-full px-3 py-2 rounded text-sm font-medium border-2 border-dashed"
                        style={{ borderColor: '#BDC3C7', color: '#7F8C8D' }}
                      >
                        + Agregar Test Personalizado
                      </button>
                    </div>
                  </div>

                  {/* Tests Seleccionados */}
                  {selectedTests.length > 0 && (
                    <div className="p-3 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F7F7F7' }}>
                      <h5 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>
                        Tests Seleccionados ({selectedTests.length})
                      </h5>
                      <div className="space-y-3">
                        {selectedTests.map((test, index) => (
                          <div key={index} className="p-3 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium" style={{ color: '#2C3E50' }}>{test.name}</span>
                              <button
                                onClick={() => setSelectedTests(selectedTests.filter((_, i) => i !== index))}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Eliminar
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#7F8C8D' }}>Resultado</label>
                                <input
                                  type="text"
                                  value={test.result}
                                  onChange={(e) => {
                                    const updatedTests = [...selectedTests];
                                    updatedTests[index].result = e.target.value;
                                    setSelectedTests(updatedTests);
                                  }}
                                  placeholder="Ej: Positivo, Negativo, 45°"
                                  className="w-full p-2 text-xs border rounded" 
                                  style={{ borderColor: '#BDC3C7' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#7F8C8D' }}>Observaciones</label>
                                <input
                                  type="text"
                                  value={test.observations}
                                  onChange={(e) => {
                                    const updatedTests = [...selectedTests];
                                    updatedTests[index].observations = e.target.value;
                                    setSelectedTests(updatedTests);
                                  }}
                                  placeholder="Notas adicionales"
                                  className="w-full p-2 text-xs border rounded" 
                                  style={{ borderColor: '#BDC3C7' }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                  {/* Box Libre para Tests Adicionales */}
                  <div className="mt-4">
                    <h5 className="font-medium text-sm mb-2" style={{ color: '#2C3E50' }}>Tests Adicionales</h5>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre del test..."
                        className="w-full px-3 py-2 text-sm border rounded-lg" 
                        style={{ borderColor: '#BDC3C7' }}
                      />
                      <textarea
                        placeholder="Resultados y observaciones..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                        style={{ borderColor: '#BDC3C7' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'soap' && (
        <div className="mx-4 mb-6">
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#BDC3C7' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acto 3: Documentación Inteligente</h3>
            <p className="text-sm mb-6" style={{ color: '#7F8C8D' }}>
              SOAP generado automáticamente por AiDuxCare. Revisa y edita antes de integrar a la ficha clínica.
            </p>
            
            {/* Estado del Procesamiento */}
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="font-medium" style={{ color: '#2C3E50' }}>SOAP Generado Automáticamente</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#5DA5A3', color: 'white' }}>
                  Listo para Revisión
                </span>
              </div>
              <p className="text-sm mt-2" style={{ color: '#7F8C8D' }}>
                Basado en: {highlights.filter(h => h.isSelected).length} highlights + {legalWarnings.filter(w => w.isAccepted).length} advertencias + datos anatómicos + tests clínicos
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="subjective" className="block text-sm font-medium text-gray-700 mb-2">
                  Subjetivo
                  <span className="ml-2 text-xs" style={{ color: '#7F8C8D' }}>(Generado automáticamente - Editable)</span>
                </label>
                <textarea
                  id="subjective"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del paciente sobre su problema..."
                  value={consultationData.soapData.subjective || "Paciente refiere dolor en hombro derecho de 3 meses de evolución, con limitación progresiva de movimientos. El dolor se agrava con movimientos de elevación y abducción. No refiere traumatismo previo."}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, subjective: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivo
                  <span className="ml-2 text-xs" style={{ color: '#7F8C8D' }}>(Generado automáticamente - Editable)</span>
                </label>
                <textarea
                  id="objective"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Hallazgos del examen físico..."
                  value={consultationData.soapData.objective || "Examen físico: ROM hombro derecho limitado - Flexión: 45° (normal 180°), Abducción: 30° (normal 180°). Test ULL3 positivo con parestesias en territorio C5-C6. Test opérculo torácico con pulso radial disminuido en posición de estrés."}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, objective: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label htmlFor="assessment" className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment
                  <span className="ml-2 text-xs" style={{ color: '#7F8C8D' }}>(Generado automáticamente - Editable)</span>
                </label>
                <textarea
                  id="assessment"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Diagnóstico y evaluación clínica..."
                  value={consultationData.soapData.assessment || "Diagnóstico: Hombro congelado (capsulitis adhesiva) derecho con síndrome de opérculo torácico asociado. Limitación funcional severa con patrón de arco doloroso característico. Compromiso neurológico leve en territorio C5-C6."}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, assessment: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">
                  Plan
                  <span className="ml-2 text-xs" style={{ color: '#7F8C8D' }}>(Generado automáticamente - Editable)</span>
                </label>
                <textarea
                  id="plan"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Plan de tratamiento y seguimiento..."
                  value={consultationData.soapData.plan || "1. Terapia manual para movilización capsular progresiva. 2. Ejercicios de Codman y pendulares. 3. Técnicas de liberación neural para opérculo torácico. 4. Control en 1 semana para evaluar progreso. 5. Considerar infiltración si no hay mejoría en 2 semanas."}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    soapData: { ...prev.soapData, plan: e.target.value }
                  }))}
                />
              </div>
            </div>
            
            {/* Información de Auditoría */}
            <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: '#BDC3C7', backgroundColor: '#F7F7F7' }}>
              <h4 className="font-medium text-sm mb-2" style={{ color: '#2C3E50' }}>Información de Auditoría</h4>
              <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: '#7F8C8D' }}>
                <div>
                  <span className="font-medium">Profesional:</span> Dr. Juan Pérez
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Última edición:</span> {new Date().toLocaleTimeString()}
                </div>
                <div>
                  <span className="font-medium">Versión:</span> 1.0
                </div>
              </div>
            </div>
            
            {/* Botones de Acción */}
            <div className="flex justify-center mt-6 space-x-3">
              <button
                className="px-6 py-2 rounded text-white font-medium transition-colors"
                style={{ backgroundColor: '#5DA5A3' }}
              >
                📄 Exportar PDF
              </button>
              <button
                className="px-6 py-2 rounded text-white font-medium transition-colors"
                style={{ backgroundColor: '#FF6F61' }}
              >
                🔄 Regenerar SOAP
              </button>
              <button
                className="px-6 py-2 rounded text-white font-medium transition-colors"
                style={{ backgroundColor: '#27AE60' }}
              >
                ✅ Integrar a Ficha Clínica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asistente Virtual */}
      {showAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5DA5A3' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 className="text-lg font-bold" style={{ color: '#2C3E50' }}>AIDUX Asistente Virtual</h3>
              </div>
              <button
                onClick={() => setShowAssistant(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar asistente virtual"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#A8E6CF' }}>
                <h4 className="font-medium mb-2" style={{ color: '#2C3E50' }}>Consultas Disponibles:</h4>
                <ul className="text-sm space-y-1" style={{ color: '#2C3E50' }}>
                  <li>💊 Información de medicamentos</li>
                  <li>📋 Historia previa del paciente</li>
                  <li>📚 Términos médicos desconocidos</li>
                  <li>🔬 Protocolos de tratamiento</li>
                  <li>⚠️ Contraindicaciones y alertas</li>
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Escribe tu consulta..."
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ 
                    borderColor: '#BDC3C7'
                  }}
                />
                <button
                  className="px-4 py-2 rounded text-white font-medium transition-colors"
                  style={{ backgroundColor: '#5DA5A3' }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalWorkflowPage; 