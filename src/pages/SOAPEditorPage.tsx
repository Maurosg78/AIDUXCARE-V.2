import React, { useState, useEffect } from 'react';

import logger from '@/shared/utils/logger';

interface SOAPNote {
  id: string;
  patientId: string;
  date: Date;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  highlights: string[];
  warnings: string[];
  status: 'draft' | 'final' | 'signed';
}

interface SOAPEditorPageProps {
  patientId?: string;
  initialData?: Partial<SOAPNote>;
}

export const SOAPEditorPage: React.FC<SOAPEditorPageProps> = ({ 
  patientId = 'P001',
  initialData 
}) => {
  const [soapNote, setSoapNote] = useState<SOAPNote>({
    id: `SOAP_${Date.now()}`,
    patientId,
    date: new Date(),
    subjective: initialData?.subjective || '',
    objective: initialData?.objective || '',
    assessment: initialData?.assessment || '',
    plan: initialData?.plan || '',
    highlights: initialData?.highlights || [],
    warnings: initialData?.warnings || [],
    status: 'draft'
  });

  const [activeSection, setActiveSection] = useState<'subjective' | 'objective' | 'assessment' | 'plan'>('subjective');
  const [isEditing, setIsEditing] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Auto-guardar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (isEditing && soapNote.status === 'draft') {
        saveSOAPNote();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [soapNote, isEditing]);

  const saveSOAPNote = async () => {
    try {
      // Aquí se guardaría en Firestore
      logger.info('Guardando SOAP:', soapNote);
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('SOAP guardado exitosamente');
    } catch (error) {
      logger.error('Error al guardar SOAP:', error);
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Aquí se generaría el PDF oficial
      logger.info('Generando PDF oficial...');
      
      // Simular generación de PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actualizar estado a final
      setSoapNote({ ...soapNote, status: 'final' });
      
      logger.info('PDF generado y enviado a ficha del paciente');
      
      // Aquí se enviaría a la ficha del paciente
      // await sendToPatientRecord(soapNote);
      
    } catch (error) {
      logger.error('Error al generar PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const updateSection = (section: keyof Pick<SOAPNote, 'subjective' | 'objective' | 'assessment' | 'plan'>, value: string) => {
    setSoapNote({ ...soapNote, [section]: value });
  };

  const addHighlight = (highlight: string) => {
    if (highlight.trim()) {
      setSoapNote({ ...soapNote, highlights: [...soapNote.highlights, highlight.trim()] });
    }
  };

  const removeHighlight = (index: number) => {
    setSoapNote({ 
      ...soapNote, 
      highlights: soapNote.highlights.filter((_, i) => i !== index) 
    });
  };

  const addWarning = (warning: string) => {
    if (warning.trim()) {
      setSoapNote({ ...soapNote, warnings: [...soapNote.warnings, warning.trim()] });
    }
  };

  const removeWarning = (index: number) => {
    setSoapNote({ 
      ...soapNote, 
      warnings: soapNote.warnings.filter((_, i) => i !== index) 
    });
  };

  const sections = [
    { id: 'subjective', name: 'Subjetivo (S)', description: 'Síntomas y quejas del paciente' },
    { id: 'objective', name: 'Objetivo (O)', description: 'Hallazgos del examen físico' },
    { id: 'assessment', name: 'Evaluación (A)', description: 'Diagnóstico y análisis clínico' },
    { id: 'plan', name: 'Plan (P)', description: 'Tratamiento y seguimiento' }
  ];

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border" style={{ borderColor: '#BDC3C7' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
              SOAP - Nota Clínica
            </h1>
            <p className="text-sm mt-1" style={{ color: '#BDC3C7' }}>
              {soapNote.date.toLocaleDateString('es-CL')} - Paciente: {patientId}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              soapNote.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              soapNote.status === 'final' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {soapNote.status === 'draft' ? 'Borrador' :
               soapNote.status === 'final' ? 'Final' : 'Firmado'}
            </span>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              {showPreview ? 'Editar' : 'Vista Previa'}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditing 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isEditing ? 'Guardar' : 'Editar'}
            </button>
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF || soapNote.status === 'draft'}
              className="px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando PDF...</span>
                </div>
              ) : (
                'Enviar como PDF'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Panel Izquierdo - Editor SOAP */}
        <div className="w-2/3 p-6 border-r" style={{ borderColor: '#BDC3C7' }}>
          {showPreview ? (
            /* Vista Previa */
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.id} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3" style={{ color: '#2C3E50' }}>
                    {section.name}
                  </h3>
                  <div className="prose max-w-none">
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#2C3E50' }}>
                      {soapNote[section.id as keyof Pick<SOAPNote, 'subjective' | 'objective' | 'assessment' | 'plan'>] || 'Sin contenido'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Editor */
            <div className="space-y-6">
              {/* Navegación de Secciones */}
              <div className="flex space-x-2 border-b" style={{ borderColor: '#BDC3C7' }}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as keyof Pick<SOAPNote, 'subjective' | 'objective' | 'assessment' | 'plan'>)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {section.name}
                  </button>
                ))}
              </div>

              {/* Editor de Sección Activa */}
              <div>
                <div className="mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: '#2C3E50' }}>
                    {sections.find(s => s.id === activeSection)?.name}
                  </h3>
                  <p className="text-sm" style={{ color: '#BDC3C7' }}>
                    {sections.find(s => s.id === activeSection)?.description}
                  </p>
                </div>
                <textarea
                  value={soapNote[activeSection]}
                  onChange={(e) => updateSection(activeSection, e.target.value)}
                  disabled={!isEditing}
                  rows={12}
                  className="w-full px-4 py-3 border rounded-lg text-sm resize-none font-mono"
                  style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
                  placeholder={`Escriba aquí la sección ${sections.find(s => s.id === activeSection)?.name}...`}
                />
              </div>

              {/* Contador de Caracteres */}
              <div className="text-xs text-right" style={{ color: '#BDC3C7' }}>
                {soapNote[activeSection].length} caracteres
              </div>
            </div>
          )}
        </div>

        {/* Panel Derecho - Highlights y Warnings */}
        <div className="w-1/3 p-6">
          {/* Highlights */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2C3E50' }}>
              Highlights de Captura
            </h3>
            <div className="space-y-2 mb-3">
              {soapNote.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border" style={{ borderColor: '#10B981' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10B981' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="text-sm flex-1" style={{ color: '#2C3E50' }}>
                    {highlight}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => removeHighlight(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Agregar highlight..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addHighlight(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg"
                  style={{ borderColor: '#BDC3C7' }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addHighlight(input.value);
                    input.value = '';
                  }}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Warnings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#2C3E50' }}>
              ⚠️ Advertencias y Puntos Ciegos
            </h3>
            <div className="space-y-2 mb-3">
              {soapNote.warnings.map((warning, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg border" style={{ borderColor: '#EF4444' }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#EF4444' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <span className="text-sm flex-1" style={{ color: '#2C3E50' }}>
                    {warning}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => removeWarning(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Agregar advertencia..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addWarning(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg"
                  style={{ borderColor: '#BDC3C7' }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addWarning(input.value);
                    input.value = '';
                  }}
                  className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Información del Documento */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#2C3E50' }}>
              Información del Documento
            </h3>
            <div className="space-y-2 text-xs" style={{ color: '#BDC3C7' }}>
              <div className="flex justify-between">
                <span>ID del documento:</span>
                <span>{soapNote.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha de creación:</span>
                <span>{soapNote.date.toLocaleDateString('es-CL')}</span>
              </div>
              <div className="flex justify-between">
                <span>Última modificación:</span>
                <span>{new Date().toLocaleDateString('es-CL')}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className="font-medium" style={{ color: '#2C3E50' }}>
                  {soapNote.status === 'draft' ? 'Borrador' :
                   soapNote.status === 'final' ? 'Final' : 'Firmado'}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="mt-4 space-y-2">
            <button
              onClick={saveSOAPNote}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Guardar Borrador
            </button>
            <button
              onClick={() => setSoapNote({ ...soapNote, status: 'final' })}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Marcar como Final
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOAPEditorPage; 