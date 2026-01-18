import React from 'react';

/**
 * Terms of Service Page
 * Required legal document disclosing third-party processors
 * PHIPA/PIPEDA-aware (design goal)
 */
const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 font-apple">
            Terms of Service - AiduxCare
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-CA')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Purpose of the System</h2>
              <p className="text-gray-700 mb-4">
                AiduxCare is an intelligent clinical copilot designed to assist healthcare professionals, not to replace them. The system provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>AI-assisted clinical documentation</li>
                <li>Structured SOAP note generation</li>
                <li>Red flag and contraindication detection</li>
                <li>Clinical workflow optimization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Professional Responsibilities</h2>
              <p className="text-gray-700 mb-4">
                By using AiduxCare, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Maintain independent clinical judgment</li>
                <li>Review and validate all system suggestions</li>
                <li>Assume final responsibility for all clinical decisions</li>
                <li>Not delegate critical decisions to the AI system</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Service Providers</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Required Disclosure - PHIPA Section 18</h3>
                <p className="text-blue-800 mb-3">
                  AiduxCare uses the following third-party artificial intelligence processors to provide services:
                </p>
                <ul className="list-disc pl-6 text-blue-800 space-y-2">
                  <li>
                    <strong>Speech Recognition:</strong> OpenAI (Whisper API)
                    <br />
                    <span className="text-sm">Location: United States | Purpose: Audio transcription (optional)</span>
                  </li>
                  <li>
                    <strong>Clinical Analysis & SOAP Generation:</strong> Google Cloud Platform - Vertex AI (Gemini 2.5 Flash)
                    <br />
                    <span className="text-sm">Location: Canada (northamerica-northeast1, Montreal) | Purpose: Clinical insights & documentation</span>
                  </li>
                </ul>
                <p className="text-blue-800 mt-3 text-sm">
                  <strong>Important:</strong> All AI processing initiated by AiduxCare is routed through Canadian infrastructure by default. Any cross-border processing (e.g., Whisper transcription) is disclosed to the treating physiotherapist for PHIPA/PIPEDA compliance.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Processing and Storage</h2>
              <p className="text-gray-700 mb-4">
                Your clinical data is processed as follows:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Audio recordings are transcribed using OpenAI Whisper API</li>
                <li>Clinical analysis is performed using Google Vertex AI (Gemini models)</li>
                <li>SOAP notes are generated using Google Vertex AI (Gemini models)</li>
                <li>All AI processing occurs in the United States (us-central1 region)</li>
                <li>Data is encrypted in transit and at rest</li>
                <li>Access is restricted to authorized personnel only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Service Limitations</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>The system does not substitute professional clinical evaluation</li>
                <li>Results must be interpreted by qualified professionals</li>
                <li>Absolute accuracy is not guaranteed in all situations</li>
                <li>Constant human supervision is required</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Only for authorized healthcare professionals</li>
                <li>In appropriate clinical environments</li>
                <li>For assistance and documentation purposes</li>
                <li>Respecting patient confidentiality</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Compliance</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-green-900 mb-2">PHIPA Compliance (Ontario, Canada)</h3>
                <p className="text-green-800">
                  AiduxCare complies with the Personal Health Information Protection Act, 2004 (PHIPA) for Ontario patients. All third-party processors are disclosed as required by PHIPA Section 18.
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">PIPEDA Compliance (Canada)</h3>
                <p className="text-purple-800">
                  AiduxCare complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) for cross-border data transfers. Patients are informed of all third-party processors and data processing locations.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your access if:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You violate these terms</li>
                <li>You use the system inappropriately</li>
                <li>You compromise system security</li>
                <li>You fail to maintain professional standards</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact</h2>
              <p className="text-gray-700 mb-4">
                For questions about these terms of service, contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@aiduxcare.com<br/>
                  <strong>Compliance:</strong> compliance@aiduxcare.com<br/>
                  <strong>Address:</strong> [AiduxCare Business Address]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;

