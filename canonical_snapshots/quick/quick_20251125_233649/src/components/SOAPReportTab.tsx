/* @ts-nocheck */
import React, { useState, useEffect } from 'react';
import { Card } from '../shared/ui';
import { FileText, Download, Edit3, Save, Copy } from 'lucide-react';

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
    let text = 'CHIEF COMPLAINT:\n';
    
    // Main symptoms
    if (analysisData?.entities) {
      const symptoms = analysisData.entities.filter(e => e.type === 'symptom');
      if (symptoms.length > 0) {
        text += symptoms.map(s => `- ${s.text}`).join('\n');
      }
    }
    
    // Psychosocial factors
    if (analysisData?.yellowFlags?.length > 0) {
      text += '\n\nCONTEXTUAL FACTORS:\n';
      text += analysisData.yellowFlags.map(f => `- ${f}`).join('\n');
    }
    
    return text;
  };

  const generateObjective = () => {
    let text = 'PHYSICAL EVALUATION:\n';
    
    // Test results
    if (evaluationResults?.tests) {
      Object.entries(evaluationResults.tests).forEach(([test, result]) => {
        text += `\n${test}: ${result}`;
        if (evaluationResults.notes?.[test]) {
          text += ` (${evaluationResults.notes[test]})`;
        }
      });
    } else {
      text += 'Physical evaluation pending completion.';
    }
    
    return text;
  };

  const generateAssessment = () => {
    let text = 'CLINICAL ASSESSMENT:\n';
    
    const redFlags = Array.isArray(analysisData?.redFlags) ? analysisData.redFlags : [];
    if (redFlags.length > 0) {
      text += '\nCRITICAL ALERTS:\n';
      text += redFlags
        .map(rf => {
          if (typeof rf === 'string') {
            return `- ${rf}`;
          }
          if (rf && typeof rf === 'object') {
            const pattern = 'pattern' in rf ? rf.pattern : 'Red flag';
            const action = 'action' in rf ? rf.action : 'Requires medical evaluation.';
            return `- ${pattern}: ${action}`;
          }
          return '- Red flag detected';
        })
        .join('\n');
    }
    
    // Functional diagnosis
    text += '\n\nFUNCTIONAL DIAGNOSIS:\n';
    text += 'Based on the evaluation performed...';
    
    return text;
  };

  const generatePlan = () => {
    let text = 'TREATMENT PLAN:\n';
    
    const redFlags = Array.isArray(analysisData?.redFlags) ? analysisData.redFlags : [];
    if (redFlags.length > 0) {
      text += '\nURGENT REFERRAL REQUIRED\n';
    }
    
    text += '\nGOALS:\n';
    text += '1. \n2. \n3. \n';
    
    text += '\nINTERVENTIONS:\n';
    text += '- Manual therapy\n';
    text += '- Therapeutic exercise\n';
    text += '- Modalities (TENS, US, Tecar therapy, Infrared light, Shockwave therapy)\n';
    text += '- Patient education\n';
    
    text += '\nFREQUENCY: ___ sessions per week\n';
    text += 'ESTIMATED DURATION: ___ weeks\n';
    text += 'NEXT APPOINTMENT: ___';
    
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
Signed: ${patientData?.therapist || 'Physiotherapist'}
Date: ${new Date().toLocaleString()}
    `;
    
    onSaveReport(fullReport);
    setIsEditing(false);
  };

  const handleCopy = () => {
    const fullReport = Object.values(soapReport).join('\n\n');
    navigator.clipboard.writeText(fullReport);
  };

  return (
    <div className="space-y-4 p-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">${t("workflow.soapReport")}</h2>
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
            <h3 className="font-semibold text-lg mb-2 text-blue-600">S - ${t("soap.subjective")}</h3>
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
            <h3 className="font-semibold text-lg mb-2 text-green-600">O - ${t("soap.objective")}</h3>
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
            <h3 className="font-semibold text-lg mb-2 text-purple-600">A - Assessment</h3>
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
            <h3 className="font-semibold text-lg mb-2 text-orange-600">P - ${t("soap.plan")}</h3>
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
