import React from 'react';

const LAST_UPDATED = 'January 18, 2026';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            AiduxCare Privacy Policy (Pilot)
          </h1>
          <p className="text-sm text-slate-500 mb-10">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2>1. Scope</h2>
              <p>
                This Privacy Policy explains how <strong>AiduxCare Inc.</strong> ("AiduxCare", "we", "our") collects, uses, discloses, and protects <strong>personal information</strong> and, where applicable, <strong>personal health information (PHI)</strong> when Canadian healthcare professionals use AiduxCare.
              </p>
              <p>
                In Ontario, clinicians are typically the <strong>Health Information Custodian (HIC)</strong> under PHIPA, and AiduxCare generally acts as a <strong>service provider / agent</strong> processing information on the clinician's behalf, subject to applicable agreements and instructions.
              </p>
            </section>

            <section className="mb-8">
              <h2>2. Information We Collect</h2>
              <p>Depending on the features used, we may collect:</p>
              <ul>
                <li><strong>Clinician account data:</strong> name, email, clinic information, authentication and security settings (e.g., MFA status), and licensing/professional profile details (if provided).</li>
                <li><strong>Patient and clinical data entered by the clinician:</strong> intake details, clinical notes (e.g., SOAP), care plans, and related documentation.</li>
                <li><strong>Consent workflow data:</strong> consent tokens, timestamps, status (e.g., granted/declined), and audit events related to consent.</li>
                <li><strong>Technical and security data:</strong> basic device/browser information, IP address, logs and event metadata used for security, troubleshooting, and auditability.</li>
              </ul>
              <p className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
                <strong>We do not sell personal information or PHI.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2>3. How We Use Information</h2>
              <p>We use information to:</p>
              <ul>
                <li>Provide the AiduxCare service and core workflows (e.g., documentation assistance, note generation, portals where enabled).</li>
                <li>Maintain <strong>auditability</strong> and operational integrity (e.g., security logging, access events, and troubleshooting).</li>
                <li>Enforce security controls, prevent abuse, and protect users and patients.</li>
                <li>Communicate product and security updates relevant to use of the service.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>4. Data Residency and AI Processing</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <h3 className="text-emerald-900 font-semibold mb-2">
                  Canadian processing (default)
                </h3>
                <p className="text-emerald-800 text-sm">
                  Core AI workflows (e.g., clinical analysis and note generation) are designed to run using <strong>Google Cloud Vertex AI</strong> in <strong>northamerica-northeast1 (Montréal, Canada)</strong>.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-900 font-semibold mb-2">
                  Cross-border services (disclosed)
                </h3>
                <p className="text-amber-800 text-sm">
                  Audio transcription features may be processed by a third-party provider outside Canada (e.g., the United States) when clinicians use the recording feature. We disclose this transfer and its purpose.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2>5. Legal Basis and Patient Rights</h2>
              <ul>
                <li><strong>PHIPA (Ontario):</strong> AiduxCare processes PHI on behalf of clinicians/HICs, following their instructions and applicable agreements.</li>
                <li><strong>PIPEDA (Canada):</strong> Individuals may request access and correction of their personal information. In clinical contexts, requests are typically handled through the treating clinician/HIC.</li>
              </ul>
              <p>
                Where permitted and applicable, individuals may also request deletion or restriction—subject to clinical, legal, and regulatory record-retention obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2>6. Security Safeguards</h2>
              <p>We use administrative, technical, and organizational safeguards appropriate to the sensitivity of the information, which may include:</p>
              <ul>
                <li>Encryption in transit and at rest (where supported by our infrastructure providers).</li>
                <li>Access controls and authentication safeguards (including MFA support).</li>
                <li>Logging and monitoring to detect suspicious activity and support auditability.</li>
                <li>Least-privilege access for internal operations.</li>
              </ul>
              <p>
                No method of transmission or storage is 100% secure; however, we work to protect information using reasonable safeguards.
              </p>
            </section>

            <section className="mb-8">
              <h2>7. Retention</h2>
              <p>
                We retain information for as long as necessary to provide the service, meet contractual obligations, support auditability, and comply with applicable laws. Retention periods may vary depending on the data type and clinical/legal requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2>8. Contact and Privacy Requests</h2>
              <p>For privacy questions or requests:</p>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="mb-2">
                  <strong>Email:</strong> <a href="mailto:privacy@aiduxcare.com" className="text-indigo-600 hover:text-indigo-800 underline">privacy@aiduxcare.com</a>
                </p>
                <p>
                  <strong>Postal (Pilot / Niagara Hub):</strong><br />
                  AiduxCare Inc.<br />
                  <strong>Niagara Falls Innovation Hub</strong><br />
                  4255 Queen St, Niagara Falls, ON L2E 2L3, Canada
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                If you are a patient, please contact your treating clinician first. If needed, you may also contact us with the subject line <strong>"Privacy Request"</strong>. We respond within a reasonable timeframe and in accordance with applicable law.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;