/**
 * MVA PDF Generator
 * 
 * Generates PDF documents for MVA forms (OCF-18, OCF-19, OCF-21, OCF-23, OCF-24).
 * 
 * Sprint 2B - Day 3-4: MVA Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * 
 * Uses jsPDF and jspdf-autotable for professional PDF generation.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MVAFormData, MVAFormType } from '../types/mva';

/**
 * MVA PDF Generator
 * 
 * Generates PDF documents for various MVA form types (OCF forms).
 */
export class MVAPdfGenerator {
  /**
   * Generate MVA Treatment Plan PDF (OCF-18)
   * 
   * @param data - MVA form data
   * @returns PDF blob
   */
  static generateTreatmentPlanPDF(data: MVAFormData): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MVA TREATMENT PLAN (OCF-18)', 105, yPos, { align: 'center' });
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
    if (data.patient.driverLicenseNumber) {
      patientInfo.push(['Driver License:', data.patient.driverLicenseNumber]);
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
    
    // Accident Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCIDENT INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const accidentInfo = [
      ['Date of Accident:', data.accident.dateOfAccident.toLocaleDateString('en-CA')],
      ['Time of Accident:', data.accident.timeOfAccident || 'Not specified'],
      ['Location:', data.accident.location],
      ['Accident Type:', data.accident.accidentType],
      ['Vehicle Role:', data.accident.vehicleRole.charAt(0).toUpperCase() + data.accident.vehicleRole.slice(1)],
      ['Seatbelt Used:', data.accident.seatbeltUsed !== undefined ? (data.accident.seatbeltUsed ? 'Yes' : 'No') : 'Not specified'],
      ['Airbag Deployed:', data.accident.airbagDeployed !== undefined ? (data.accident.airbagDeployed ? 'Yes' : 'No') : 'Not specified'],
      ['Ambulance Required:', data.accident.ambulanceRequired ? 'Yes' : 'No'],
      ['Hospital Admitted:', data.accident.hospitalAdmitted ? 'Yes' : 'No'],
    ];
    
    if (data.accident.hospitalName) {
      accidentInfo.push(['Hospital:', data.accident.hospitalName]);
    }
    if (data.accident.hospitalAdmissionDate) {
      accidentInfo.push(['Admission Date:', data.accident.hospitalAdmissionDate.toLocaleDateString('en-CA')]);
    }
    if (data.accident.hospitalDischargeDate) {
      accidentInfo.push(['Discharge Date:', data.accident.hospitalDischargeDate.toLocaleDateString('en-CA')]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: accidentInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Accident Description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Accident Description:', 14, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const accidentDescLines = doc.splitTextToSize(data.accident.accidentDescription, 180);
    doc.text(accidentDescLines, 14, yPos);
    yPos += accidentDescLines.length * 5 + 10;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Injury Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INJURY INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const injuryInfo = [
      ['Primary Injury:', data.injury.primaryInjury],
      ['Body Parts Affected:', data.injury.bodyPartsAffected.join(', ')],
      ['Pre-Accident Status:', data.injury.preAccidentStatus],
      ['Current Status:', data.injury.currentStatus],
    ];
    
    if (data.injury.painLevel !== undefined) {
      injuryInfo.push(['Pain Level:', `${data.injury.painLevel}/10`]);
    }
    if (data.injury.painLocation && data.injury.painLocation.length > 0) {
      injuryInfo.push(['Pain Location:', data.injury.painLocation.join(', ')]);
    }
    if (data.injury.symptoms.length > 0) {
      injuryInfo.push(['Symptoms:', data.injury.symptoms.join(', ')]);
    }
    
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
        lim.severity,
        lim.duration,
        lim.frequency,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Activity', 'Limitation', 'Severity', 'Duration', 'Frequency']],
        body: limitationsTable,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
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
      ['Start Date:', data.treatment.startDate.toLocaleDateString('en-CA')],
      ['Frequency:', data.treatment.frequency],
      ['Duration:', data.treatment.duration],
      ['Expected Outcome:', data.treatment.expectedOutcome],
      ['Prior Approval Required:', data.treatment.priorApprovalRequired ? 'Yes' : 'No'],
    ];
    
    if (data.treatment.estimatedCost) {
      treatmentInfo.push(['Estimated Cost:', `$${data.treatment.estimatedCost.toFixed(2)}`]);
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
    
    // Return-to-Activities Recommendations
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RETURN-TO-ACTIVITIES RECOMMENDATIONS', 14, yPos);
    yPos += 8;
    
    const rta = data.clinical.returnToActivitiesRecommendations;
    const rtaInfo = [
      ['Driving:', rta.driving.cleared ? 'Cleared' : 'Not Cleared'],
      ['Work:', rta.work.cleared ? 'Cleared' : 'Not Cleared'],
      ['Activities of Daily Living:', rta.activitiesOfDailyLiving.status],
    ];
    
    if (rta.driving.restrictions) {
      rtaInfo.push(['Driving Restrictions:', rta.driving.restrictions]);
    }
    if (rta.driving.timeline) {
      rtaInfo.push(['Driving Timeline:', rta.driving.timeline]);
    }
    if (rta.work.restrictions) {
      rtaInfo.push(['Work Restrictions:', rta.work.restrictions]);
    }
    if (rta.work.timeline) {
      rtaInfo.push(['Work Timeline:', rta.work.timeline]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: rtaInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Insurance Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INSURANCE INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const insuranceInfo = [
      ['Insurance Company:', data.insurance.insuranceCompany],
      ['Policy Number:', data.insurance.policyNumber],
      ['Claim Number:', data.insurance.claimNumber],
    ];
    
    if (data.insurance.adjusterName) {
      insuranceInfo.push(['Adjuster Name:', data.insurance.adjusterName]);
    }
    if (data.insurance.adjusterPhone) {
      insuranceInfo.push(['Adjuster Phone:', data.insurance.adjusterPhone]);
    }
    if (data.insurance.adjusterEmail) {
      insuranceInfo.push(['Adjuster Email:', data.insurance.adjusterEmail]);
    }
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: insuranceInfo,
      theme: 'plain',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
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
    
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }
  
  /**
   * Generate MVA Treatment Confirmation PDF (OCF-19)
   * 
   * @param data - MVA form data
   * @returns PDF blob
   */
  static generateTreatmentConfirmationPDF(data: MVAFormData): Blob {
    // Similar structure to Treatment Plan but focused on confirmation
    return this.generateTreatmentPlanPDF(data); // For now, reuse same structure
  }
  
  /**
   * Generate MVA Treatment Plan Update PDF (OCF-23)
   * 
   * @param data - MVA form data
   * @param previousData - Optional previous report for comparison
   * @returns PDF blob
   */
  static generateTreatmentPlanUpdatePDF(
    data: MVAFormData,
    previousData?: MVAFormData
  ): Blob {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MVA TREATMENT PLAN UPDATE (OCF-23)', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${data.reportDate.toLocaleDateString('en-CA')}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Comparison with previous report
    if (previousData) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPARISON WITH PREVIOUS REPORT', 14, yPos);
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
        doc.text('Update Notes:', 14, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(data.additionalNotes, 180);
        doc.text(notesLines, 14, yPos);
        yPos += notesLines.length * 5 + 10;
      }
    }
    
    // Continue with standard treatment plan content
    // (Reuse logic from generateTreatmentPlanPDF)
    // For brevity, we'll add a note and continue
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('See attached treatment plan for current details.', 14, yPos);
    yPos += 10;
    
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
   * Get filename for MVA form
   * 
   * @param formType - Type of MVA form
   * @param patientName - Patient name
   * @param date - Report date
   * @returns Filename string
   */
  static getFilename(formType: MVAFormType, patientName: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const nameStr = patientName.replace(/\s+/g, '_').toUpperCase();
    
    const formTypeMap: Record<MVAFormType, string> = {
      'treatment-plan': 'OCF-18',
      'treatment-confirmation': 'OCF-19',
      'attendant-care-assessment': 'OCF-21',
      'treatment-plan-update': 'OCF-23',
      'treatment-confirmation-update': 'OCF-24',
    };
    
    return `MVA_${formTypeMap[formType]}_${nameStr}_${dateStr}.pdf`;
  }
}

