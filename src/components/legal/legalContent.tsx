/**
 * Legal Content - MVP Documents
 * 
 * Plain language legal documents for AiDuxCare (CA market)
 * Aligned with PHIPA/PIPEDA, based on public benchmarks
 * 
 * @see WO-PROMPT-CAPABILITY-AWARE-01 (Legal MVP)
 * Last Updated: 2025-12-15
 */

import React from 'react';

const LAST_UPDATED = 'December 15, 2025';
const VERSION = '1.0.0';

export const PrivacyContent: React.FC = () => (
  <>
    <p className="text-sm text-gray-600 mb-6 italic">
      <strong>Disclaimer:</strong> This document is not legal advice. For legal questions, consult your legal counsel.
    </p>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Who We Are</h3>
      <p className="mb-4">
        AiDuxCare Inc. ("AiDuxCare", "we", "our") is a software provider that offers AI-assisted clinical documentation tools 
        for licensed Canadian physiotherapists. We act as a <strong>PHIPA Agent</strong> - you (the physiotherapist) remain 
        the <strong>Health Information Custodian (HIC)</strong> for patient data.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">2. What Data We Process</h3>
      <p className="mb-2">During professional onboarding, we collect:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>Your professional identity (name, email, license number)</li>
        <li>Your credentials (specialty, years of experience, workplace)</li>
        <li>Your location (city, province, country) for regulatory compliance</li>
      </ul>
      <p className="mb-2"><strong>Note:</strong> We do <strong>NOT</strong> collect patient data during onboarding. Patient data 
      is only processed when you use the clinical documentation features, and you control that data.</p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Professional Data</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>To provide you access to the platform and verify your professional credentials</li>
        <li>To personalize the AI assistant based on your experience level and specialty</li>
        <li>To comply with regulatory requirements (CPO, provincial licensing bodies)</li>
        <li>To communicate with you about your account and service updates</li>
      </ul>
      <p className="text-sm text-gray-600 mt-4">
        <strong>We do NOT:</strong> Sell your data, share it with advertisers, or use it for marketing without your consent.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Data Storage & Security</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="font-semibold text-blue-900 mb-2">Canadian Data Residency</p>
        <p className="text-blue-800 text-sm">
          All professional profile data and patient data are stored in Canada (Firebase/Firestore in <strong>northamerica-northeast1</strong>, 
          Montreal). AI processing uses Google Vertex AI in the same region. This ensures compliance with PHIPA and PIPEDA 
          data residency requirements.
        </p>
      </div>
      <p className="mb-2">We implement:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>Encryption in transit and at rest (where supported by our infrastructure providers)</li>
        <li>Multi-factor authentication (MFA) for account access</li>
        <li>Security audits and monitoring</li>
        <li>Access controls (only authorized personnel)</li>
      </ul>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">5. PHIPA / PIPEDA Principles</h3>
      <p className="mb-4">
        We align with core privacy principles:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li><strong>Purpose Limitation:</strong> We only use data for the purposes you've agreed to</li>
        <li><strong>Safeguards:</strong> Technical and organizational measures to protect your data</li>
        <li><strong>Auditability:</strong> We maintain audit logs of all data access and modifications</li>
        <li><strong>Transparency:</strong> This document explains what we do with your data</li>
      </ul>
      <p className="text-sm text-gray-600 mt-4">
        <strong>Important:</strong> As the HIC, you remain responsible for patient data. We are your agent and follow your instructions.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Audit Logs</h3>
      <p className="mb-4">
        We maintain audit logs that record:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>When your account is accessed</li>
        <li>When data is created, modified, or deleted</li>
        <li>When data is shared or exported</li>
        <li>Security events (login attempts, permission changes)</li>
      </ul>
      <p className="text-sm text-gray-600">
        These logs are retained according to PHIPA requirements and are available for compliance audits.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights</h3>
      <p className="mb-2">You have the right to:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>Access your professional profile data</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of your account (subject to retention requirements)</li>
        <li>Export your data</li>
      </ul>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">8. Contact</h3>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="mb-2">
          <strong>Privacy & Compliance:</strong> privacy@aiduxcare.com
        </p>
        <p className="mb-2">
          <strong>General Support:</strong> support@aiduxcare.com
        </p>
        <p className="text-sm text-gray-600 mt-2">
          We respond to privacy requests within 30 days.
        </p>
      </div>
    </section>

    <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
      Version {VERSION} · Last Updated: {LAST_UPDATED}
    </div>
  </>
);

export const TermsContent: React.FC = () => (
  <>
    <p className="text-sm text-gray-600 mb-6 italic">
      <strong>Disclaimer:</strong> This document is not legal advice. For legal questions, consult your legal counsel.
    </p>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">1. What AiDuxCare Does</h3>
      <p className="mb-4">
        AiDuxCare is an <strong>AI-assisted clinical documentation tool</strong> for licensed Canadian physiotherapists. 
        We provide:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>AI-powered analysis of patient transcripts</li>
        <li>Structured SOAP note generation</li>
        <li>Red flag and yellow flag detection</li>
        <li>Clinical reasoning support (not clinical decisions)</li>
      </ul>
      <p className="text-sm text-red-600 font-semibold mt-4">
        <strong>Critical:</strong> AiDuxCare does NOT provide diagnoses, treatment plans, or medical advice. 
        You are the responsible clinician.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Your Responsibilities</h3>
      <p className="mb-4">As a licensed professional using AiDuxCare, you agree to:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li><strong>Maintain independent clinical judgment</strong> - Review and validate all AI suggestions</li>
        <li><strong>Assume full clinical and legal responsibility</strong> - You are the Health Information Custodian (HIC)</li>
        <li><strong>Use the system appropriately</strong> - Only for licensed physiotherapy practice within your scope</li>
        <li><strong>Protect patient privacy</strong> - Follow PHIPA/PIPEDA and your professional standards</li>
        <li><strong>Not delegate clinical decisions to AI</strong> - The AI is a tool, not a replacement for your expertise</li>
      </ul>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">3. What AiDuxCare Does NOT Do</h3>
      <p className="mb-2">AiDuxCare:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li><strong>Does NOT diagnose</strong> - We expose patterns and correlations, not diagnoses</li>
        <li><strong>Does NOT prescribe</strong> - We suggest considerations, not treatments</li>
        <li><strong>Does NOT replace your expertise</strong> - We assist, not replace, clinical reasoning</li>
        <li><strong>Does NOT guarantee accuracy</strong> - AI outputs require your validation</li>
        <li><strong>Does NOT assume liability</strong> - You are responsible for all clinical decisions</li>
      </ul>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Appropriate Use</h3>
      <p className="mb-2">You may use AiDuxCare for:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>Documenting clinical assessments within your scope of practice</li>
        <li>Identifying potential red flags that require medical referral</li>
        <li>Structuring clinical notes for record-keeping</li>
        <li>Supporting clinical reasoning with evidence-based considerations</li>
      </ul>
      <p className="mb-2">You must <strong>NOT</strong> use AiDuxCare for:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-red-700">
        <li>Making definitive diagnoses without proper clinical evaluation</li>
        <li>Bypassing your professional judgment or standards</li>
        <li>Sharing patient data inappropriately</li>
        <li>Using the system in a way that violates your professional obligations</li>
      </ul>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">5. Account Suspension</h3>
      <p className="mb-4">
        We may suspend or terminate your account if you:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>Violate these Terms of Use</li>
        <li>Use the system inappropriately or unethically</li>
        <li>Compromise system security or patient privacy</li>
        <li>Fail to comply with your professional obligations</li>
        <li>Provide false or misleading information about your credentials</li>
      </ul>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">6. Jurisdiction</h3>
      <p className="mb-4">
        These Terms of Use are governed by the laws of <strong>Ontario, Canada</strong>. Any disputes will be resolved 
        in the courts of Ontario. You agree to comply with all applicable Canadian federal, provincial, and local laws, 
        including PHIPA, PIPEDA, and your provincial professional regulations.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h3>
      <p className="mb-4">
        To the maximum extent permitted by law, AiDuxCare and its providers are not liable for:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>Clinical decisions made by you based on AI suggestions</li>
        <li>Inaccuracies or errors in AI-generated content</li>
        <li>Loss or damage resulting from your use or misuse of the system</li>
      </ul>
      <p className="text-sm text-gray-600">
        This limitation does not apply to death or personal injury caused by our negligence, or fraud.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h3>
      <p className="mb-4">
        We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. 
        Continued use after changes constitutes acceptance of the updated Terms.
      </p>
    </section>

    <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
      Version {VERSION} · Last Updated: {LAST_UPDATED}
    </div>
  </>
);

export const PHIPAPIPEDAContent: React.FC = () => (
  <>
    <p className="text-sm text-gray-600 mb-6 italic">
      <strong>Disclaimer:</strong> This document is not legal advice. For legal questions, consult your legal counsel.
    </p>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">What is PHIPA?</h3>
      <p className="mb-4">
        <strong>PHIPA</strong> (Personal Health Information Protection Act) is Ontario's health privacy law. It governs how 
        health information custodians (like physiotherapists) collect, use, and disclose personal health information.
      </p>
      <p className="mb-4">
        As a licensed physiotherapist in Ontario, <strong>you are the Health Information Custodian (HIC)</strong> for your 
        patients' health information. AiDuxCare acts as your <strong>PHIPA Agent</strong> - we process data on your behalf 
        and under your instructions.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">What is PIPEDA?</h3>
      <p className="mb-4">
        <strong>PIPEDA</strong> (Personal Information Protection and Electronic Documents Act) is Canada's federal privacy law 
        for the private sector. It applies to how organizations collect, use, and disclose personal information in commercial activities.
      </p>
      <p className="mb-4">
        AiDuxCare complies with PIPEDA principles, including:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>Consent for collection, use, and disclosure</li>
        <li>Purpose limitation (only use data for stated purposes)</li>
        <li>Safeguards (security measures to protect data)</li>
        <li>Accountability (we are responsible for data we process)</li>
      </ul>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">What is an Audit Trail?</h3>
      <p className="mb-4">
        An <strong>audit trail</strong> is a log that records who accessed what data, when, and why. In healthcare, audit trails are 
        required for compliance and accountability.
      </p>
      <p className="mb-2">AiDuxCare maintains audit trails that record:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li>When patient data is accessed, created, modified, or deleted</li>
        <li>Who performed each action (user account, timestamp)</li>
        <li>What data was involved</li>
        <li>Any exports or sharing of data</li>
      </ul>
      <p className="text-sm text-gray-600">
        These logs are retained according to PHIPA requirements (minimum 7 years for health records) and are available for 
        compliance audits or investigations.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Responsibility as the HIC</h3>
      <p className="mb-4">
        Even though AiDuxCare processes data as your agent, <strong>you remain legally responsible</strong> for:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li><strong>Obtaining patient consent</strong> - You must obtain consent before using AiDuxCare to process patient data</li>
        <li><strong>Ensuring appropriate use</strong> - Only use the system within your scope of practice and professional standards</li>
        <li><strong>Maintaining clinical control</strong> - Review and validate all AI outputs before using them</li>
        <li><strong>Responding to patient requests</strong> - Patients may request access, correction, or deletion of their data</li>
        <li><strong>Reporting breaches</strong> - You must report privacy breaches to patients and regulators as required</li>
      </ul>
      <p className="text-sm text-red-600 font-semibold mt-4">
        <strong>Important:</strong> AiDuxCare does NOT assume your responsibilities as the HIC. We are a tool provider, 
        not a healthcare provider.
      </p>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Residency</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="font-semibold text-blue-900 mb-2">Canadian Data Storage</p>
        <p className="text-blue-800 text-sm">
          All patient data and professional data processed by AiDuxCare is stored in Canada (Montreal region). 
          AI processing uses Google Vertex AI in the same region. This ensures compliance with PHIPA and PIPEDA 
          data residency requirements.
        </p>
      </div>
    </section>

    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Resources</h3>
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
        <li><strong>IPC Ontario:</strong> <a href="https://www.ipc.on.ca" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.ipc.on.ca</a> - PHIPA guidance for health providers</li>
        <li><strong>Privacy Commissioner of Canada:</strong> <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.priv.gc.ca</a> - PIPEDA information</li>
        <li><strong>College of Physiotherapists of Ontario:</strong> <a href="https://www.collegept.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.collegept.org</a> - Professional standards and record-keeping</li>
      </ul>
    </section>

    <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
      Version {VERSION} · Last Updated: {LAST_UPDATED}
    </div>
  </>
);

export { LAST_UPDATED, VERSION };

