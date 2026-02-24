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
  referringDoctor?: string;
  redFlags: ReferralReportRedFlag[];
  chiefComplaint?: string;
  clinicalNotes?: string;
}

export class ReferralReportGenerator {
  static generatePDF(data: ReferralReportData): Blob {
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PHYSIOTHERAPY CLINICAL COMMUNICATION', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Medical Referral — Urgent Review Requested', 105, yPos, { align: 'center' });
    yPos += 6;

    // Separator line
    doc.setDrawColor(150);
    doc.line(14, yPos, 196, yPos);
    yPos += 8;

    // Patient Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientLines = [
      `Name: ${data.patientName}`,
      `Date of Birth: ${data.patientDOB || 'Not specified'}`,
      `Session Date: ${data.sessionDate}`,
    ];
    patientLines.forEach((line) => {
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    yPos += 4;

    // Referring Physiotherapist
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REFERRING PHYSIOTHERAPIST', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const referringPhysicianText = data.referringDoctor || 'Not specified';
    const physioLines = [
      `Physiotherapist: ${data.physiotherapistName}`,
      `Referring Physician on file: ${referringPhysicianText}`,
    ];
    physioLines.forEach((line) => {
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    yPos += 4;

    // Clinical Red Flags table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL RED FLAGS IDENTIFIED', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const tableBody =
      data.redFlags.length > 0
        ? data.redFlags.map((flag) => {
            const decisionLabel =
              flag.decision === 'referral_stop'
                ? 'Referral + Stop physiotherapy'
                : 'Referral + Continue safe modalities';

            const notesParts: string[] = [];
            if (flag.continuationNote) notesParts.push(`Continuation: ${flag.continuationNote}`);
            if (flag.evidence) notesParts.push(`Evidence: ${flag.evidence}`);

            return [
              flag.label,
              flag.urgency || '',
              decisionLabel,
              notesParts.join(' | '),
            ];
          })
        : [['No specific red flags documented', '', '', '']];

    autoTable(doc, {
      startY: yPos,
      head: [['Flag', 'Urgency', 'Decision', 'Notes']],
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

    // @ts-expect-error jspdf-autotable extends doc instance at runtime
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Chief complaint and clinical notes (optional)
    if (data.chiefComplaint) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CHIEF COMPLAINT', 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const ccLines = doc.splitTextToSize(data.chiefComplaint, 180);
      doc.text(ccLines, 14, yPos);
      yPos += ccLines.length * 5 + 6;
    }

    if (data.clinicalNotes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CLINICAL NOTES', 14, yPos);
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
    doc.text('RECOMMENDED ACTION', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let recommendedActionText = '';
    if (hasReferralStop) {
      recommendedActionText =
        'Immediate medical evaluation recommended. Physiotherapy treatment suspended pending specialist response.';
    } else if (hasReferralContinuePartial) {
      recommendedActionText =
        'Medical evaluation recommended. Physiotherapy continuing with safe modalities only.';
    } else {
      recommendedActionText =
        'Medical review may be considered based on clinical context. No explicit referral-stop decision recorded.';
    }

    const actionLines = doc.splitTextToSize(recommendedActionText, 180);
    doc.text(actionLines, 14, yPos);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'This document is generated by AiduxCare Clinical Intelligence. The treating physiotherapist retains full clinical responsibility.',
        105,
        285,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  }
}

