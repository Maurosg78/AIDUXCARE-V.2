/* @ts-nocheck */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../shared/ui';
import { FileText, Download, Edit3, Save, Copy } from 'lucide-react';
import { isSpainPilot } from '@/core/pilotDetection';

interface SOAPReportTabProps {
  analysisData: any;
  evaluationResults: any;
  patientData: any;
  onSaveReport: (report: string) => void;
}

export const SOAPReportTab: React.FC<SOAPReportTabProps> = ({
  analysisData,
  evaluationResults,
  patientData,
  onSaveReport
}) => {
  const { t } = useTranslation();
  const esPilotEnabled = isSpainPilot();
  const [soapReport, setSoapReport] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    generateSOAPReport();
  }, [analysisData, evaluationResults]);

  const generateSOAPReport = () => {
    // Generar secciones automáticamente basado en los datos
    const subjective = generateSubjective();
    const objective = generateObjective();
    const assessment = generateAssessment();
    const plan = generatePlan();

    setSoapReport({
      subjective,
      objective,
      assessment,
      plan
    });
  };

  const generateSubjective = () => {
    const newline = '\n';
    let text = esPilotEnabled ? 'MOTIVO DE CONSULTA:\n' : 'CHIEF COMPLAINT:\n';
    
    // Main symptoms
    if (analysisData?.entities) {
      const symptoms = analysisData.entities.filter(e => e.type === 'symptom');
      if (symptoms.length > 0) {
        text += symptoms.map(s => `- ${s.text}`).join(newline);
      }
    }
    
    // Psychosocial factors
    if (analysisData?.yellowFlags?.length > 0) {
      text += esPilotEnabled ? '\n\nFACTORES CONTEXTUALES:\n' : '\n\nCONTEXTUAL FACTORS:\n';
      text += analysisData.yellowFlags.map(f => `- ${f}`).join(newline);
    }
    
    return text;
  };

  const generateObjective = () => {
    let text = esPilotEnabled ? 'VALORACIÓN FÍSICA:\n' : 'PHYSICAL EVALUATION:\n';
    
    // Test results
    if (evaluationResults?.tests) {
      Object.entries(evaluationResults.tests).forEach(([test, result]) => {
        text += `\n${test}: ${result}`;
        if (evaluationResults.notes?.[test]) {
          text += ` (${evaluationResults.notes[test]})`;
        }
      });
    } else {
      text += esPilotEnabled ? 'Valoración física pendiente de completar.' : 'Physical evaluation pending completion.';
    }
    
    return text;
  };

  const generateAssessment = () => {
    const newline = '\n';
    let text = esPilotEnabled ? 'VALORACIÓN CLÍNICA:\n' : 'CLINICAL ASSESSMENT:\n';
    
    const redFlags = Array.isArray(analysisData?.redFlags) ? analysisData.redFlags : [];
    if (redFlags.length > 0) {
      text += esPilotEnabled ? '\nALERTAS CRÍTICAS:\n' : '\nCRITICAL ALERTS:\n';
      text += redFlags
        .map(rf => {
          if (typeof rf === 'string') {
            return `- ${rf}`;
          }
          if (rf && typeof rf === 'object') {
            const pattern = 'pattern' in rf ? rf.pattern : esPilotEnabled ? 'Red flag' : 'Red flag';
            const action = 'action' in rf ? rf.action : esPilotEnabled ? 'Requiere valoración médica.' : 'Requires medical evaluation.';
            return `- ${pattern}: ${action}`;
          }
          return esPilotEnabled ? '- Red flag detectada' : '- Red flag detected';
        })
        .join(newline);
    }
    
    // Functional diagnosis
    text += esPilotEnabled ? '\n\nDIAGNÓSTICO FUNCIONAL:\n' : '\n\nFUNCTIONAL DIAGNOSIS:\n';
    text += esPilotEnabled ? 'Basado en la valoración realizada...' : 'Based on the evaluation performed...';
    
    return text;
  };

  const generatePlan = () => {
    let text = esPilotEnabled ? 'PLAN DE TRATAMIENTO:\n' : 'TREATMENT PLAN:\n';
    
    const redFlags = Array.isArray(analysisData?.redFlags) ? analysisData.redFlags : [];
    if (redFlags.length > 0) {
      text += esPilotEnabled ? '\nDERIVACIÓN URGENTE REQUERIDA\n' : '\nURGENT REFERRAL REQUIRED\n';
    }
    
    text += esPilotEnabled ? '\nOBJETIVOS:\n' : '\nGOALS:\n';
    text += '1. \n2. \n3. \n';
    
    text += esPilotEnabled ? '\nINTERVENCIONES:\n' : '\nINTERVENTIONS:\n';
    text += esPilotEnabled ? '- Terapia manual\n' : '- Manual therapy\n';
    text += esPilotEnabled ? '- Ejercicio terapéutico\n' : '- Therapeutic exercise\n';
    text += esPilotEnabled
      ? '- Modalidades (TENS, US, Terapia Tecar, Luz infrarroja, Ondas de choque)\n'
      : '- Modalities (TENS, US, Tecar therapy, Infrared light, Shockwave therapy)\n';
    text += esPilotEnabled ? '- Educación al paciente\n' : '- Patient education\n';
    
    text += esPilotEnabled ? '\nFRECUENCIA: ___ sesiones por semana\n' : '\nFREQUENCY: ___ sessions per week\n';
    text += esPilotEnabled ? 'DURACIÓN ESTIMADA: ___ semanas\n' : 'ESTIMATED DURATION: ___ weeks\n';
    text += esPilotEnabled ? 'SIGUIENTE CITA: ___' : 'NEXT APPOINTMENT: ___';
    
    return text;
  };

  const handleSectionChange = (section: string, value: string) => {
    setSoapReport({
      ...soapReport,
      [section]: value
    });
  };

  const handleSave = () => {
    const fullReport = `
INFORME SOAP - ${new Date().toLocaleDateString()}
=============================================

SUBJETIVO:
${soapReport.subjective}

OBJETIVO:
${soapReport.objective}

ASSESSMENT (VALORACIÓN):
${soapReport.assessment}

PLAN:
${soapReport.plan}

=============================================
${esPilotEnabled ? 'Firmado:' : 'Signed:'} ${patientData?.therapist || (esPilotEnabled ? 'Fisioterapeuta' : 'Physiotherapist')}
${esPilotEnabled ? 'Fecha:' : 'Date:'} ${new Date().toLocaleString()}
    `;
    
    onSaveReport(fullReport);
    setIsEditing(false);
  };

  const handleCopy = () => {
    const newline = '\n';
    const sectionBreak = `${newline}${newline}`;
    const soapSections = [
      soapReport.subjective ? `SUBJETIVO:${newline}${soapReport.subjective}` : null,
      soapReport.objective ? `OBJETIVO:${newline}${soapReport.objective}` : null,
      soapReport.assessment ? `VALORACIÓN:${newline}${soapReport.assessment}` : null,
      soapReport.plan ? `PLAN:${newline}${soapReport.plan}` : null,
    ];
    const filteredSections = soapSections.filter(Boolean);
    const formattedSoapText = filteredSections.join(sectionBreak);
    navigator.clipboard.writeText(formattedSoapText);
  };

  return (
    <div className="space-y-4 p-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{t("workflow.soapReport")}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Vista previa' : 'Editar'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* SUBJETIVO */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-blue-600">S - {t("soap.subjective")}</h3>
            {isEditing ? (
              <textarea
                value={soapReport.subjective}
                onChange={(e) => handleSectionChange('subjective', e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows={6}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {soapReport.subjective}
              </div>
            )}
          </div>

          {/* OBJETIVO */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-green-600">O - {t("soap.objective")}</h3>
            {isEditing ? (
              <textarea
                value={soapReport.objective}
                onChange={(e) => handleSectionChange('objective', e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows={6}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {soapReport.objective}
              </div>
            )}
          </div>

          {/* ASSESSMENT */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-600">A - {esPilotEnabled ? 'Valoración' : 'Assessment'}</h3>
            {isEditing ? (
              <textarea
                value={soapReport.assessment}
                onChange={(e) => handleSectionChange('assessment', e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows={6}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {soapReport.assessment}
              </div>
            )}
          </div>

          {/* PLAN */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-orange-600">P - {t("soap.plan")}</h3>
            {isEditing ? (
              <textarea
                value={soapReport.plan}
                onChange={(e) => handleSectionChange('plan', e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows={6}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {soapReport.plan}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
