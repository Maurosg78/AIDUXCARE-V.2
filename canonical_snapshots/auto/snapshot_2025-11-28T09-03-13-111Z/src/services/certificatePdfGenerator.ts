/**
 * Certificate PDF Generator
 * 
 * Generates PDF documents for medical certificates (Medical Certificate, Return-to-Work, Fitness-to-Work, Disability, Accommodation).
 * 
 * Sprint 2B - Day 5: Certificate Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * 
 * Uses jsPDF and jspdf-autotable for professional PDF generation.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CertificateData, CertificateType } from '../types/certificate';

/**
 * Certificate PDF Generator
 * 
 * Generates PDF documents for various medical certificate types.
 */
export class CertificatePdfGenerator {
  /**
   * Generate Medical Certificate PDF
   * 
   * @param data - Certificate data
   * @returns PDF blob
   */
  static generateMedicalCertificatePDF(data: CertificateData): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL CERTIFICATE', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Certificate Number: ${data.certificateNumber || 'N/A'}`, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Issue Date: ${data.issueDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    if (data.compliance.expiryDate) {
      yPos += 6;
      doc.text(`Valid Until: ${data.compliance.expiryDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    }
    yPos += 15;
    
    // Patient Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientInfo = [
      ['Name:', data.patient.name],
      ['Date of Birth:', data.patient.dateOfBirth.toLocaleDateString('en-CA')],
      ['Address:', `${data.patient.address}, ${data.patient.city}, ${data.patient.province} ${data.patient.postalCode}`],
      ['Phone:', data.patient.phone],
    ];
    
    if (data.patient.email) {
      patientInfo.push(['Email:', data.patient.email]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: patientInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Professional Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFESSIONAL INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const professionalInfo = [
      ['Name:', data.professional.name],
      ['Registration Number:', data.professional.registrationNumber],
      ['Clinic:', data.professional.clinicName],
      ['Address:', `${data.professional.clinicAddress}, ${data.professional.clinicCity}, ${data.professional.clinicProvince} ${data.professional.clinicPostalCode}`],
      ['Phone:', data.professional.phone],
      ['Email:', data.professional.email],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: professionalInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Medical Condition Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL CONDITION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const conditionInfo = [
      ['Diagnosis:', data.condition.diagnosis],
      ['Onset Date:', data.condition.onsetDate.toLocaleDateString('en-CA')],
      ['Current Status:', data.condition.currentStatus],
      ['Functional Impact:', data.condition.functionalImpact],
    ];
    
    if (data.condition.secondaryDiagnoses && data.condition.secondaryDiagnoses.length > 0) {
      conditionInfo.push(['Secondary Diagnoses:', data.condition.secondaryDiagnoses.join(', ')]);
    }
    if (data.condition.symptoms.length > 0) {
      conditionInfo.push(['Symptoms:', data.condition.symptoms.join(', ')]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: conditionInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Work Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('WORK INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const workInfo = [
      ['Occupation:', data.work.occupation],
      ['Cleared for Work:', data.work.clearedForWork ? 'Yes' : 'No'],
      ['Cleared for Full Duties:', data.work.clearedForFullDuties ? 'Yes' : 'No'],
      ['Cleared for Modified Duties:', data.work.clearedForModifiedDuties ? 'Yes' : 'No'],
    ];
    
    if (data.work.employerName) {
      workInfo.push(['Employer:', data.work.employerName]);
    }
    if (data.work.lastWorkDate) {
      workInfo.push(['Last Work Date:', data.work.lastWorkDate.toLocaleDateString('en-CA')]);
    }
    if (data.work.expectedReturnDate) {
      workInfo.push(['Expected Return Date:', data.work.expectedReturnDate.toLocaleDateString('en-CA')]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: workInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Work Restrictions
    if (data.work.workRestrictions && data.work.workRestrictions.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Work Restrictions:', 14, yPos);
      yPos += 6;
      
      const restrictionsTable = data.work.workRestrictions.map((restriction, idx) => [
        (idx + 1).toString(),
        restriction,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Restriction']],
        body: restrictionsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Accommodations
    if (data.work.accommodations && data.work.accommodations.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Workplace Accommodations:', 14, yPos);
      yPos += 6;
      
      const accommodationsTable = data.work.accommodations.map((accommodation, idx) => [
        (idx + 1).toString(),
        accommodation,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Accommodation']],
        body: accommodationsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Treatment Information
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TREATMENT INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const treatmentInfo = [
      ['Treatment Duration:', data.treatment.treatmentDuration],
      ['Follow-Up Required:', data.treatment.followUpRequired ? 'Yes' : 'No'],
    ];
    
    if (data.treatment.followUpDate) {
      treatmentInfo.push(['Follow-Up Date:', data.treatment.followUpDate.toLocaleDateString('en-CA')]);
    }
    if (data.treatment.expectedRecoveryDate) {
      treatmentInfo.push(['Expected Recovery Date:', data.treatment.expectedRecoveryDate.toLocaleDateString('en-CA')]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: treatmentInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Treatments Provided
    if (data.treatment.treatmentProvided.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Treatments Provided:', 14, yPos);
      yPos += 6;
      
      const treatmentsTable = data.treatment.treatmentProvided.map((treatment, idx) => [
        (idx + 1).toString(),
        treatment,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Treatment']],
        body: treatmentsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Medications
    if (data.treatment.medications && data.treatment.medications.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Medications:', 14, yPos);
      yPos += 6;
      
      const medicationsTable = data.treatment.medications.map((medication, idx) => [
        (idx + 1).toString(),
        medication,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Medication']],
        body: medicationsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Clinical Assessment (SOAP)
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL ASSESSMENT', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECTIVE:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const subjectiveLines = doc.splitTextToSize(data.clinical.subjective, 180);
    doc.text(subjectiveLines, 14, yPos);
    yPos += subjectiveLines.length * 5 + 8;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('OBJECTIVE:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const objectiveLines = doc.splitTextToSize(data.clinical.objective, 180);
    doc.text(objectiveLines, 14, yPos);
    yPos += objectiveLines.length * 5 + 8;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('ASSESSMENT:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const assessmentLines = doc.splitTextToSize(data.clinical.assessment, 180);
    doc.text(assessmentLines, 14, yPos);
    yPos += assessmentLines.length * 5 + 8;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('PLAN:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const planLines = doc.splitTextToSize(data.clinical.plan, 180);
    doc.text(planLines, 14, yPos);
    yPos += planLines.length * 5 + 10;
    
    // Restrictions
    if (data.clinical.restrictions.physical.length > 0 || 
        data.clinical.restrictions.work.length > 0 || 
        data.clinical.restrictions.activities.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESTRICTIONS', 14, yPos);
      yPos += 8;
      
      if (data.clinical.restrictions.physical.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Physical Restrictions:', 14, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        data.clinical.restrictions.physical.forEach((restriction) => {
          doc.text(`• ${restriction}`, 20, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
      
      if (data.clinical.restrictions.work.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Work Restrictions:', 14, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        data.clinical.restrictions.work.forEach((restriction) => {
          doc.text(`• ${restriction}`, 20, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
      
      if (data.clinical.restrictions.activities.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Activity Restrictions:', 14, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        data.clinical.restrictions.activities.forEach((restriction) => {
          doc.text(`• ${restriction}`, 20, yPos);
          yPos += 5;
        });
        yPos += 5;
      }
    }
    
    // Prognosis
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGNOSIS', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const prognosisLines = doc.splitTextToSize(data.clinical.prognosis, 180);
    doc.text(prognosisLines, 14, yPos);
    yPos += prognosisLines.length * 5 + 10;
    
    // Compliance Disclaimers
    if (data.compliance.disclaimers.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPLIANCE DISCLAIMERS', 14, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      data.compliance.disclaimers.forEach((disclaimer) => {
        const disclaimerLines = doc.splitTextToSize(disclaimer, 180);
        doc.text(disclaimerLines, 14, yPos);
        yPos += disclaimerLines.length * 4 + 5;
        
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      });
    }
    
    // Signature Section
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos = 250; // Position signature near bottom
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Signature:', 14, yPos);
    yPos += 15;
    
    // Signature line
    doc.line(14, yPos, 100, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.text(data.professional.name, 14, yPos);
    yPos += 5;
    doc.text(`Registration Number: ${data.professional.registrationNumber}`, 14, yPos);
    yPos += 5;
    doc.text(`Date: ${data.issueDate.toLocaleDateString('en-CA')}`, 14, yPos);
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount} | Certificate Type: ${data.certificateType} | Generated by AiduxCare`,
        105,
        285,
        { align: 'center' }
      );
    }
    
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }
  
  /**
   * Generate Return-to-Work Certificate PDF
   * 
   * @param data - Certificate data
   * @returns PDF blob
   */
  static generateReturnToWorkCertificatePDF(data: CertificateData): Blob {
    // Similar structure but emphasizes return-to-work clearance
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RETURN-TO-WORK CERTIFICATE', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Certificate Number: ${data.certificateNumber || 'N/A'}`, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Issue Date: ${data.issueDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    if (data.compliance.expiryDate) {
      yPos += 6;
      doc.text(`Valid Until: ${data.compliance.expiryDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    }
    yPos += 15;
    
    // Clearance Statement (prominent)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const clearanceText = data.work.clearedForWork 
      ? 'PATIENT IS CLEARED TO RETURN TO WORK'
      : 'PATIENT IS NOT CLEARED TO RETURN TO WORK';
    doc.text(clearanceText, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Patient and Professional Info (abbreviated)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const headerInfo = [
      ['Patient:', data.patient.name],
      ['Professional:', `${data.professional.name} (${data.professional.registrationNumber})`],
      ['Occupation:', data.work.occupation],
    ];
    
    if (data.work.employerName) {
      headerInfo.push(['Employer:', data.work.employerName]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: headerInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Work Status Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('WORK STATUS', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const workStatusInfo = [
      ['Cleared for Full Duties:', data.work.clearedForFullDuties ? 'Yes' : 'No'],
      ['Cleared for Modified Duties:', data.work.clearedForModifiedDuties ? 'Yes' : 'No'],
    ];
    
    if (data.work.expectedReturnDate) {
      workStatusInfo.push(['Expected Return Date:', data.work.expectedReturnDate.toLocaleDateString('en-CA')]);
    }
    if (data.work.lastWorkDate) {
      workStatusInfo.push(['Last Work Date:', data.work.lastWorkDate.toLocaleDateString('en-CA')]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: workStatusInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Restrictions and Accommodations (if applicable)
    if (data.work.workRestrictions && data.work.workRestrictions.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Work Restrictions:', 14, yPos);
      yPos += 6;
      
      const restrictionsTable = data.work.workRestrictions.map((restriction, idx) => [
        (idx + 1).toString(),
        restriction,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Restriction']],
        body: restrictionsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    if (data.work.accommodations && data.work.accommodations.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Workplace Accommodations:', 14, yPos);
      yPos += 6;
      
      const accommodationsTable = data.work.accommodations.map((accommodation, idx) => [
        (idx + 1).toString(),
        accommodation,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Accommodation']],
        body: accommodationsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Clinical Basis
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL BASIS', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const assessmentLines = doc.splitTextToSize(data.clinical.assessment, 180);
    doc.text(assessmentLines, 14, yPos);
    yPos += assessmentLines.length * 5 + 10;
    
    // Prognosis
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGNOSIS:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const prognosisLines = doc.splitTextToSize(data.clinical.prognosis, 180);
    doc.text(prognosisLines, 14, yPos);
    yPos += prognosisLines.length * 5 + 10;
    
    // Signature Section
    yPos = 250;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Signature:', 14, yPos);
    yPos += 15;
    
    doc.line(14, yPos, 100, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.text(data.professional.name, 14, yPos);
    yPos += 5;
    doc.text(`Registration Number: ${data.professional.registrationNumber}`, 14, yPos);
    yPos += 5;
    doc.text(`Date: ${data.issueDate.toLocaleDateString('en-CA')}`, 14, yPos);
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount} | Generated by AiduxCare`,
        105,
        285,
        { align: 'center' }
      );
    }
    
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }
  
  /**
   * Generate Fitness-to-Work Certificate PDF
   * 
   * @param data - Certificate data
   * @returns PDF blob
   */
  static generateFitnessToWorkCertificatePDF(data: CertificateData): Blob {
    // Similar to return-to-work but focuses on fitness assessment
    return this.generateReturnToWorkCertificatePDF(data); // Reuse structure
  }
  
  /**
   * Generate Disability Certificate PDF
   * 
   * @param data - Certificate data
   * @returns PDF blob
   */
  static generateDisabilityCertificatePDF(data: CertificateData): Blob {
    // Similar structure but emphasizes disability status
    return this.generateMedicalCertificatePDF(data); // Reuse structure
  }
  
  /**
   * Generate Accommodation Certificate PDF
   * 
   * @param data - Certificate data
   * @returns PDF blob
   */
  static generateAccommodationCertificatePDF(data: CertificateData): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('WORKPLACE ACCOMMODATION CERTIFICATE', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Certificate Number: ${data.certificateNumber || 'N/A'}`, 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Issue Date: ${data.issueDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    if (data.compliance.expiryDate) {
      yPos += 6;
      doc.text(`Valid Until: ${data.compliance.expiryDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    }
    yPos += 15;
    
    // Patient and Employer Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT AND EMPLOYER INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const headerInfo = [
      ['Patient Name:', data.patient.name],
      ['Occupation:', data.work.occupation],
    ];
    
    if (data.work.employerName) {
      headerInfo.push(['Employer:', data.work.employerName]);
    }
    if (data.work.employerAddress) {
      headerInfo.push(['Employer Address:', data.work.employerAddress]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: headerInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Medical Condition
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL CONDITION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const conditionInfo = [
      ['Diagnosis:', data.condition.diagnosis],
      ['Functional Impact:', data.condition.functionalImpact],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: conditionInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Recommended Accommodations (prominent)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDED WORKPLACE ACCOMMODATIONS', 14, yPos);
    yPos += 8;
    
    if (data.work.accommodations && data.work.accommodations.length > 0) {
      const accommodationsTable = data.work.accommodations.map((accommodation, idx) => [
        (idx + 1).toString(),
        accommodation,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Accommodation']],
        body: accommodationsTable,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No specific accommodations recommended at this time.', 14, yPos);
      yPos += 10;
    }
    
    // Work Restrictions
    if (data.work.workRestrictions && data.work.workRestrictions.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('WORK RESTRICTIONS', 14, yPos);
      yPos += 8;
      
      const restrictionsTable = data.work.workRestrictions.map((restriction, idx) => [
        (idx + 1).toString(),
        restriction,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Restriction']],
        body: restrictionsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Clinical Basis
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL BASIS FOR ACCOMMODATIONS', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const assessmentLines = doc.splitTextToSize(data.clinical.assessment, 180);
    doc.text(assessmentLines, 14, yPos);
    yPos += assessmentLines.length * 5 + 10;
    
    // Professional Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFESSIONAL INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const professionalInfo = [
      ['Name:', data.professional.name],
      ['Registration Number:', data.professional.registrationNumber],
      ['Clinic:', data.professional.clinicName],
      ['Phone:', data.professional.phone],
      ['Email:', data.professional.email],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: professionalInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Signature Section
    yPos = 250;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Signature:', 14, yPos);
    yPos += 15;
    
    doc.line(14, yPos, 100, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.text(data.professional.name, 14, yPos);
    yPos += 5;
    doc.text(`Registration Number: ${data.professional.registrationNumber}`, 14, yPos);
    yPos += 5;
    doc.text(`Date: ${data.issueDate.toLocaleDateString('en-CA')}`, 14, yPos);
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount} | Generated by AiduxCare`,
        105,
        285,
        { align: 'center' }
      );
    }
    
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }
  
  /**
   * Download PDF file
   * 
   * @param blob - PDF blob
   * @param filename - Filename for download
   */
  static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Get filename for certificate
   * 
   * @param certificateType - Type of certificate
   * @param patientName - Patient name
   * @param date - Issue date
   * @returns Filename string
   */
  static getFilename(certificateType: CertificateType, patientName: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const nameStr = patientName.replace(/\s+/g, '_').toUpperCase();
    
    const certificateTypeMap: Record<CertificateType, string> = {
      'medical-certificate': 'MED-CERT',
      'return-to-work-certificate': 'RTW-CERT',
      'fitness-to-work-certificate': 'FTW-CERT',
      'disability-certificate': 'DIS-CERT',
      'accommodation-certificate': 'ACC-CERT',
    };
    
    return `CERT_${certificateTypeMap[certificateType]}_${nameStr}_${dateStr}.pdf`;
  }
}

