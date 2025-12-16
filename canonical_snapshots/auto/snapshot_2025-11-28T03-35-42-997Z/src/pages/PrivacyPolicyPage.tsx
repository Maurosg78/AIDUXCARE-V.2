import React from 'react';

const LAST_UPDATED = 'November 27, 2025';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            AiduxCare Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mb-10">
            Last updated: {LAST_UPDATED}
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2>1. Scope</h2>
              <p>
                This policy explains how AiduxCare Inc. (“AiduxCare”, “we”, “our”) collects, uses,
                discloses, and protects personal health information for Canadian healthcare
                professionals and their patients. We act as a PHIPA Agent and physiotherapists remain
                the Health Information Custodian (HIC).
              </p>
            </section>

            <section className="mb-8">
              <h2>2. Information We Collect</h2>
              <ul>
                <li>Clinician identity and licensing information</li>
                <li>Authentication data (email, MFA state, audit logs)</li>
                <li>Clinical inputs (transcripts, SOAP content, vitals)</li>
                <li>Operational telemetry (IP, device fingerprint) for security monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>3. How We Use Information</h2>
              <ul>
                <li>Provide AI-assisted documentation and hospital portals</li>
                <li>Maintain audit trails for PHIPA / PIPEDA and ISO 27001 compliance</li>
                <li>Detect anomalies, prevent fraud, and safeguard access</li>
                <li>Communicate service updates, security alerts, and compliance notices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>4. Data Residency & AI Processing</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <h3 className="text-emerald-900 font-semibold">
                  Canadian Processing (Default)
                </h3>
                <p className="text-emerald-800 text-sm">
                  All core AI workflows (analysis, SOAP generation, hospital portal) run via Google Cloud
                  Vertex AI hosted in <strong>northamerica-northeast1 (Montreal, Canada)</strong>. Production data
                  resides on Canadian infrastructure only.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-900 font-semibold">
                  Cross-Border Services (Disclosed)
                </h3>
                <p className="text-amber-800 text-sm">
                  Whisper-based audio transcription is processed by OpenAI (United States) when clinicians opt-in to
                  record sessions. We disclose this transfer in accordance with PHIPA Section 17/18 and PIPEDA Principle 4.1.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2>5. Legal Grounds & Patient Rights</h2>
              <ul>
                <li>PHIPA: AiduxCare is an agent; HICs retain custody and control.</li>
                <li>PIPEDA: Individuals may request access, correction, or deletion via their clinician.</li>
                <li>We notify custodians of privacy incidents within 24 hours.</li>
                <li>Audit logs for every access, copy, and transfer are retained per retention policies.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>6. Security Controls</h2>
              <ul>
                <li>AES-256 encryption at rest; TLS 1.3 in transit</li>
                <li>Mandatory MFA and 5-minute idle session timeout</li>
                <li>Canadian-only hosting for production services</li>
                <li>Immutable audit logging, anomaly detection, and incident response</li>
                <li>Periodic penetration testing and ISO 27001-aligned audits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>7. Contact & Privacy Requests</h2>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p>
                  <strong>Email:</strong> privacy@aiduxcare.com<br />
                  <strong>Compliance Hotline:</strong> +1 (437) 887-4102<br />
                  <strong>Postal:</strong> AiduxCare Inc., 325 Front St W, Suite 300, Toronto, ON M5V 2Y1, Canada
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                To exercise PHIPA or PIPEDA rights, contact your treating physiotherapist or email us with the
                subject “Privacy Request”. We respond within 30 days.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;