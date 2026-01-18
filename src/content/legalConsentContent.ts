/**
 * Legal Consent Document Content
 * Plain text format - no formatting, no emphasis
 * English language for Canadian patients
 * PHIPA/PIPEDA-aware (design goal)
 * 
 * IMPORTANT: This document MUST include specific third-party processor names
 * as required by PHIPA Section 18 (knowledgeable consent)
 */

export const LEGAL_CONSENT_CONTENT = {
  title: "INFORMED CONSENT FOR HEALTH DATA PROCESSING",
  
  sections: {
    header: `Personal Health Information Protection Act, 2004 (PHIPA) - Ontario, Canada
This document establishes the terms under which you authorize the processing of your personal health information using artificial intelligence.`,

    patientInfo: `PATIENT INFORMATION
Patient Name: [Patient Name]
Physiotherapist: [Physiotherapist Name]
Clinic: [Clinic Name]
Date: [Date]`,

    important: `IMPORTANT: CROSS-BORDER DATA PROCESSING DISCLOSURE

All artificial intelligence processing occurs in the United States (us-central1 region). There is NO local artificial intelligence processing in Canada. All clinical data sent for artificial intelligence analysis will cross the border to servers located in the United States.

Because ALL artificial intelligence processing occurs in the United States, your health information will be processed by United States-based artificial intelligence services subject to United States laws, including the United States CLOUD Act. Under the CLOUD Act, United States authorities may access your health data without notice. No Canadian data sovereignty applies to artificial intelligence processing.`,

    patientRights: `YOUR RIGHTS UNDER PHIPA

As a patient, you have the right to know how we will process your personal health information. You have the right to refuse artificial intelligence-assisted documentation. You can request a copy of your records at any time. You can withdraw this consent at any time. You have the right to file complaints with the Information and Privacy Commissioner of Ontario (IPC).`,

    dataProcessing: `HOW YOUR DATA WILL BE PROCESSED

Clinical Documentation: Electronic records of your sessions, evaluation and treatment notes, rehabilitation plans.

Technology Tools Used: AiduxCare, artificial intelligence-assisted documentation platform.

Third-Party Processors (Required Disclosure):
- Speech Recognition: OpenAI (Whisper API) - United States
- Clinical Analysis: Google Cloud Platform - Vertex AI (Gemini 2.5 Flash) - United States (us-central1 region)
- SOAP Note Generation: Google Cloud Platform - Vertex AI (Gemini 2.0 Flash) - United States (us-central1 region)

Processing Location: All artificial intelligence processing occurs in the United States (us-central1 region, Google Cloud Platform).

Purpose: Improve accuracy and efficiency of clinical documentation through artificial intelligence assistance.

Data Transfer: Your health information will be transferred to and processed by the above-named third-party processors in the United States.`,

    dataRetention: `DATA RETENTION

Audio recordings and artificial intelligence-generated notes will be retained for 10 years or more per College of Physiotherapists of Ontario (CPO) requirements for clinical records.`,

    consentOptions: `YOUR CONSENT OPTIONS

You may choose one of the following options:

Option 1: Ongoing Consent
Apply to this session and all future sessions with this patient. You can withdraw consent at any time in settings. This option requires your digital signature.

Option 2: This Session Only
Apply consent only to this current session. You will be asked again for future sessions. This option does not require a signature.

Option 3: Decline Artificial Intelligence Processing
If you decline artificial intelligence processing, you will not be able to use AiduxCare. Your physiotherapist will use their traditional EMR system to document your care directly.`,

    professionalAccountability: `PROFESSIONAL ACCOUNTABILITY

Your physiotherapist maintains full clinical authority and responsibility for all treatment decisions. Artificial intelligence is used as an assistance tool only. All clinical decisions remain with your physiotherapist. Professional liability coverage is not affected.`,

    withdrawal: `WITHDRAWING CONSENT

You may withdraw your consent at any time by contacting your clinic or compliance@aiduxcare.com. Withdrawal will take effect immediately. If you withdraw consent, your physiotherapist will use their traditional EMR system for future documentation.`,

    complaints: `FILING COMPLAINTS

If you have concerns about how your health information is being handled, you may file a complaint with the Information and Privacy Commissioner of Ontario (IPC). Contact information: https://www.ipc.on.ca/en/health-individuals/`,

    footer: `This consent is required by PHIPA s. 18 (Personal Health Information Protection Act, 2004 - Ontario).

Questions? Contact your clinic or compliance@aiduxcare.com`
  },

  fullDocument: (patientName: string, physiotherapistName: string, clinicName: string) => {
    const date = new Date().toLocaleDateString('en-CA');
    
    return `${LEGAL_CONSENT_CONTENT.title}

${LEGAL_CONSENT_CONTENT.sections.header}

${LEGAL_CONSENT_CONTENT.sections.patientInfo.replace('[Patient Name]', patientName).replace('[Physiotherapist Name]', physiotherapistName).replace('[Clinic Name]', clinicName).replace('[Date]', date)}

${LEGAL_CONSENT_CONTENT.sections.important}

${LEGAL_CONSENT_CONTENT.sections.patientRights}

${LEGAL_CONSENT_CONTENT.sections.dataProcessing}

${LEGAL_CONSENT_CONTENT.sections.dataRetention}

${LEGAL_CONSENT_CONTENT.sections.consentOptions}

${LEGAL_CONSENT_CONTENT.sections.professionalAccountability}

${LEGAL_CONSENT_CONTENT.sections.withdrawal}

${LEGAL_CONSENT_CONTENT.sections.complaints}

${LEGAL_CONSENT_CONTENT.sections.footer}`;
  }
};
