/**
 * WSIB PDF Generator
 * 
 * Generates PDF documents for WSIB forms (FAF-8, Treatment Plan, Progress Report, RTW Assessment).
 * 
 * Sprint 2B - Day 1: WSIB Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * 
 * Uses jsPDF and jspdf-autotable for professional PDF generation.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WSIBFormData, WSIBFormType } from '../types/wsib';

/**
 * WSIB PDF Generator
 * 
 * Generates PDF documents for various WSIB form types.
 */
export class WSIBPdfGenerator {
  /**
   * Generate WSIB Functional Abilities Form PDF (FAF-8)
   * 
   * @param data - WSIB form data
   * @returns PDF blob
   */
  static generateFAF8PDF(data: WSIBFormData): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WSIB FUNCTIONAL ABILITIES FORM (FAF-8)', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${data.reportDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
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
    if (data.patient.wsibClaimNumber) {
      patientInfo.push(['WSIB Claim Number:', data.patient.wsibClaimNumber]);
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
    
    // Injury Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INJURY INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const injuryInfo = [
      ['Date of Injury:', data.injury.dateOfInjury.toLocaleDateString('en-CA')],
      ['Mechanism of Injury:', data.injury.mechanismOfInjury],
      ['Body Parts Affected:', data.injury.bodyPartAffected.join(', ')],
      ['Work Related:', data.injury.workRelated ? 'Yes' : 'No'],
      ['Pre-Injury Status:', data.injury.preInjuryStatus],
      ['Current Status:', data.injury.currentStatus],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: injuryInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Injury Description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Injury Description:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const injuryDescLines = doc.splitTextToSize(data.injury.injuryDescription, 180);
    doc.text(injuryDescLines, 14, yPos);
    yPos += injuryDescLines.length * 5 + 10;
    
    // Functional Limitations Table
    if (data.clinical.functionalLimitations.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FUNCTIONAL LIMITATIONS', 14, yPos);
      yPos += 8;
      
      const limitationsTable = data.clinical.functionalLimitations.map((lim, idx) => [
        (idx + 1).toString(),
        lim.activity,
        lim.limitation,
        lim.duration,
        lim.frequency,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Activity', 'Limitation', 'Duration', 'Frequency']],
        body: limitationsTable,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Work Restrictions Table
    if (data.clinical.workRestrictions.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('WORK RESTRICTIONS', 14, yPos);
      yPos += 8;
      
      const restrictionsTable = data.clinical.workRestrictions.map((rest, idx) => [
        (idx + 1).toString(),
        rest.restriction,
        rest.reason,
        rest.duration,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Restriction', 'Reason', 'Duration']],
        body: restrictionsTable,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Return-to-Work Recommendations
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RETURN-TO-WORK RECOMMENDATIONS', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const rtwInfo = [
      ['Current Capacity:', data.clinical.returnToWorkRecommendations.currentCapacity],
      ['Recommended Work Type:', data.clinical.returnToWorkRecommendations.recommendedWorkType],
      ['Timeline:', data.clinical.returnToWorkRecommendations.timeline],
      ['Review Date:', data.clinical.returnToWorkRecommendations.reviewDate.toLocaleDateString('en-CA')],
    ];
    
    if (data.clinical.returnToWorkRecommendations.accommodations.length > 0) {
      rtwInfo.push(['Accommodations Needed:', data.clinical.returnToWorkRecommendations.accommodations.join(', ')]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: rtwInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Clinical Assessment (SOAP)
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
    
    // Check if we need a new page
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
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount} | Form Version: ${data.formVersion} | Generated by AiduxCare`,
        105,
        285,
        { align: 'center' }
      );
    }
    
    // Convert to blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }
  
  /**
   * Generate WSIB Treatment Plan PDF
   * 
   * @param data - WSIB form data
   * @returns PDF blob
   */
  static generateTreatmentPlanPDF(data: WSIBFormData): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WSIB TREATMENT PLAN', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${data.reportDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Patient and Professional Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const headerInfo = [
      ['Patient:', `${data.patient.name}${data.patient.wsibClaimNumber ? ` | WSIB Claim: ${data.patient.wsibClaimNumber}` : ''}`],
      ['Professional:', `${data.professional.name} (${data.professional.registrationNumber})`],
    ];
    
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
    
    // Treatment Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TREATMENT DETAILS', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const treatmentInfo = [
      ['Start Date:', data.treatment.startDate.toLocaleDateString('en-CA')],
      ['Frequency:', data.treatment.frequency],
      ['Duration:', data.treatment.duration],
      ['Expected Outcome:', data.treatment.expectedOutcome],
    ];
    
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
    
    // Modalities
    if (data.treatment.modalities.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Treatment Modalities:', 14, yPos);
      yPos += 6;
      
      const modalitiesTable = data.treatment.modalities.map((modality, idx) => [
        (idx + 1).toString(),
        modality,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Modality']],
        body: modalitiesTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Exercises
    if (data.treatment.exercises.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Prescribed Exercises:', 14, yPos);
      yPos += 6;
      
      const exercisesTable = data.treatment.exercises.map((exercise, idx) => [
        (idx + 1).toString(),
        exercise,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Exercise']],
        body: exercisesTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Goals
    if (data.treatment.goals.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Treatment Goals:', 14, yPos);
      yPos += 6;
      
      const goalsTable = data.treatment.goals.map((goal, idx) => [
        (idx + 1).toString(),
        goal,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Goal']],
        body: goalsTable,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Treatment Plan from SOAP
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TREATMENT PLAN:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const planLines = doc.splitTextToSize(data.clinical.plan, 180);
    doc.text(planLines, 14, yPos);
    yPos += planLines.length * 5 + 10;
    
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
   * Generate WSIB Progress Report PDF
   * 
   * @param data - WSIB form data
   * @param previousData - Optional previous report for comparison
   * @returns PDF blob
   */
  static generateProgressReportPDF(
    data: WSIBFormData,
    previousData?: WSIBFormData
  ): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WSIB PROGRESS REPORT', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${data.reportDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Comparison with previous report
    if (previousData) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPARISON WITH PREVIOUS ASSESSMENT', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const comparisonInfo = [
        ['Previous Report Date:', previousData.reportDate.toLocaleDateString('en-CA')],
        ['Current Report Date:', data.reportDate.toLocaleDateString('en-CA')],
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [],
        body: comparisonInfo,
        theme: 'plain',
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      if (data.additionalNotes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Additional Notes:', 14, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(data.additionalNotes, 180);
        doc.text(notesLines, 14, yPos);
        yPos += notesLines.length * 5 + 10;
      }
    }
    
    // Current Status
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CURRENT STATUS', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const statusInfo = [
      ['Functional Limitations:', `${data.clinical.functionalLimitations.length} documented`],
      ['Work Restrictions:', `${data.clinical.workRestrictions.length} documented`],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: statusInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Progress Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGRESS SUMMARY', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
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
    doc.text('TREATMENT PROGRESS:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const planLines = doc.splitTextToSize(data.clinical.plan, 180);
    doc.text(planLines, 14, yPos);
    yPos += planLines.length * 5 + 10;
    
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
   * Generate Return-to-Work Assessment PDF
   * 
   * @param data - WSIB form data
   * @returns PDF blob
   */
  static generateRTWAssessmentPDF(data: WSIBFormData): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RETURN-TO-WORK ASSESSMENT', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${data.reportDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // RTW Recommendations
    const rtw = data.clinical.returnToWorkRecommendations;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RETURN-TO-WORK ASSESSMENT', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const rtwInfo = [
      ['Current Work Capacity:', rtw.currentCapacity],
      ['Recommended Work Type:', rtw.recommendedWorkType],
      ['Expected Timeline:', rtw.timeline],
      ['Next Review Date:', rtw.reviewDate.toLocaleDateString('en-CA')],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: rtwInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Restrictions
    if (rtw.restrictions.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('WORK RESTRICTIONS:', 14, yPos);
      yPos += 6;
      
      const restrictionsTable = rtw.restrictions.map((restriction, idx) => [
        (idx + 1).toString(),
        restriction.restriction,
        restriction.reason,
        restriction.duration,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Restriction', 'Reason', 'Duration']],
        body: restrictionsTable,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Accommodations
    if (rtw.accommodations.length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('WORKPLACE ACCOMMODATIONS NEEDED:', 14, yPos);
      yPos += 6;
      
      const accommodationsTable = rtw.accommodations.map((accommodation, idx) => [
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
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL BASIS FOR RTW ASSESSMENT:', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const assessmentLines = doc.splitTextToSize(data.clinical.assessment, 180);
    doc.text(assessmentLines, 14, yPos);
    yPos += assessmentLines.length * 5 + 10;
    
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
   * Get filename for WSIB form
   * 
   * @param formType - Type of WSIB form
   * @param patientName - Patient name
   * @param date - Report date
   * @returns Filename string
   */
  static getFilename(formType: WSIBFormType, patientName: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const nameStr = patientName.replace(/\s+/g, '_').toUpperCase();
    
    const formTypeMap: Record<WSIBFormType, string> = {
      'functional-abilities-form': 'FAF-8',
      'treatment-plan': 'TP',
      'progress-report': 'PR',
      'return-to-work-assessment': 'RTW',
    };
    
    return `WSIB_${formTypeMap[formType]}_${nameStr}_${dateStr}.pdf`;
  }
}

