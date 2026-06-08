import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ReferralReportDecision = 'referral_stop' | 'referral_continue_partial';

export interface ReferralReportRedFlag {
  label: string;
  decision: ReferralReportDecision;
  continuationNote?: string;
  urgency?: string;
  evidence?: string;
}

export interface ReferralReportData {
  patientName: string;
  patientDOB?: string;
  sessionDate: string;
  physiotherapistName: string;
  physiotherapistLicense?: string;
  referringDoctor?: string;
  redFlags: ReferralReportRedFlag[];
  chiefComplaint?: string;
  /** Evolution sentence from trajectory + pain series (descriptive only). Shown as "Clinical evolution" when present. */
  clinicalEvolutionSummary?: string;
  clinicalNotes?: string;
}

function calcAge(dobStr: string | undefined): string {
  if (!dobStr) return "";
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age > 0 ? String(age) : "";
}

export class ReferralReportGenerator {
  static generatePDF(data: ReferralReportData): Blob {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('COMUNICACIÓN CLÍNICA FISIOTERAPÉUTICA', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Derivación Médica — Revisión Urgente Solicitada', 105, yPos, { align: 'center' });
    yPos += 6;

    // Separator line
    doc.setDrawColor(150);
    doc.line(14, yPos, 196, yPos);
    yPos += 8;

    // Patient Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PACIENTE', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientLines = [
      `Nombre: ${data.patientName}`,
      `Fecha de nacimiento: ${data.patientDOB || "No especificada"}${calcAge(data.patientDOB) ? " (Edad: " + calcAge(data.patientDOB) + " años)" : ""}`,
      `Fecha de sesión: ${data.sessionDate}`,
    ];
    patientLines.forEach((line) => {
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    yPos += 4;

    // Referring Physiotherapist
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FISIOTERAPEUTA DERIVADOR', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const referringPhysicianText = data.referringDoctor || 'No especificado';
    const physioLines = [
      `Fisioterapeuta: ${data.physiotherapistName}`,
      `Médico derivador registrado: ${referringPhysicianText}`,
    ];
    physioLines.forEach((line) => {
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    yPos += 4;

    // Clinical Red Flags table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ALERTAS CLÍNICAS IDENTIFICADAS', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const tableBody =
      data.redFlags.length > 0
        ? data.redFlags.map((flag) => {
            const decisionLabel =
              flag.decision === 'referral_stop'
                ? 'Derivación + Suspender fisioterapia'
                : 'Derivación + Continuar con modalidades seguras';

            const notesParts: string[] = [];
            if (flag.continuationNote) notesParts.push(`Continuación: ${flag.continuationNote}`);
            if (flag.evidence) notesParts.push(`Evidencia: ${flag.evidence}`);

            return [
              flag.label,
              flag.urgency || '',
              decisionLabel,
              notesParts.join(' | '),
            ];
          })
        : [['No se documentaron alertas clínicas específicas', '', '', '']];

    autoTable(doc, {
      startY: yPos,
      head: [['Alerta', 'Urgencia', 'Decisión', 'Notas']],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25 },
        2: { cellWidth: 45 },
        3: { cellWidth: 46 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Chief complaint and clinical notes (optional)
    if (data.chiefComplaint) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('MOTIVO DE CONSULTA', 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const ccLines = doc.splitTextToSize(data.chiefComplaint, 180);
      doc.text(ccLines, 14, yPos);
      yPos += ccLines.length * 5 + 6;
    }

    if (data.clinicalEvolutionSummary) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EVOLUCIÓN CLÍNICA', 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const evolutionLines = doc.splitTextToSize(data.clinicalEvolutionSummary, 180);
      doc.text(evolutionLines, 14, yPos);
      yPos += evolutionLines.length * 5 + 6;
    }

    if (data.clinicalNotes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTAS CLÍNICAS', 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(data.clinicalNotes, 180);
      doc.text(notesLines, 14, yPos);
      yPos += notesLines.length * 5 + 6;
    }

    // Recommended action
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    const hasReferralStop = data.redFlags.some((f) => f.decision === 'referral_stop');
    const hasReferralContinuePartial = data.redFlags.some(
      (f) => f.decision === 'referral_continue_partial'
    );

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCIÓN DOCUMENTADA', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let recommendedActionText = '';
    if (hasReferralStop) {
      recommendedActionText =
        'Se documentaron indicadores clínicos para valoración de derivación inmediata. Tratamiento fisioterapéutico suspendido hasta respuesta del especialista.';
    } else if (hasReferralContinuePartial) {
      recommendedActionText =
        'Se documentaron indicadores clínicos para valoración de derivación. La fisioterapia continúa solo con modalidades seguras.';
    } else {
      recommendedActionText =
        'Puede considerarse revisión médica según el contexto clínico. No se registró una decisión explícita de suspensión por derivación.';
    }

    const actionLines = doc.splitTextToSize(recommendedActionText, 180);
    doc.text(actionLines, 14, yPos);
    const actionLinesCount = actionLines.length;
    const actionSectionHeight = actionLinesCount * 5;
    yPos += actionSectionHeight;
    yPos += 10;

    if (yPos > 245) {
      doc.addPage();
      yPos = 20;
    }

    const physiotherapistLicense = data.physiotherapistLicense || 'No especificado';
    const signatureTitle = 'FISIOTERAPEUTA RESPONSABLE';
    const signatureName = `Nombre: ${data.physiotherapistName}`;
    const signatureLicense = `Nº Colegiado: ${physiotherapistLicense}`;
    const signatureLine = '_______________________________';
    const signatureLabel = 'Firma';

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(signatureTitle, 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(signatureName, 14, yPos);
    yPos += 5;
    doc.text(signatureLicense, 14, yPos);
    yPos += 10;
    doc.text(signatureLine, 14, yPos);
    yPos += 6;
    doc.text(signatureLabel, 14, yPos);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Documento generado por AiduxCare. El fisioterapeuta tratante mantiene la responsabilidad clínica completa.',
        105,
        285,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  }
}
