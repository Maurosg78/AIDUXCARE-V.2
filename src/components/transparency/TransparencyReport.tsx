import React from 'react';
import { Link } from 'react-router-dom';
import { DataSovereigntyBadge } from './DataSovereigntyBadge';

/**
 * TransparencyReport Component
 * 
 * Full transparency report page showing:
 * - Canadian data sovereignty
 * - Named AI processors (Google Vertex AI with region)
 * - Data infrastructure (Firestore, Storage, Auth regions)
 * - Security practices and audit logging
 * 
 * This is a key competitive advantage vs Jane.app's opacity.
 * CPO and PHIPA compliance requirement for transparency.
 */
export const TransparencyReport: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/workflow" 
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
          >
            ← Back to Workflow
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supply Chain Transparency
          </h1>
          <p className="text-gray-600">
            Complete transparency about our AI processors, data infrastructure, and security practices.
            Compliant with CPO, PHIPA, and PIPEDA requirements.
          </p>
        </div>

        {/* Canadian Data Sovereignty Badge */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-4xl">🇨🇦</span>
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-xl font-semibold text-green-900 mb-2">
                100% Canadian Data Sovereignty
              </h2>
              <p className="text-green-800 mb-3">
                All data processing, storage, and AI computation occurs within Canadian borders.
                No data crosses international boundaries.
              </p>
              <DataSovereigntyBadge size="lg" />
            </div>
          </div>
        </div>

        {/* Named AI Processors */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            AI Processing Partners
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            We disclose all third-party AI processors used in clinical note generation.
            Each processor is explicitly named with region and purpose.
          </p>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Google Vertex AI (Gemini 2.5 Flash)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Primary AI processor for SOAP note generation and clinical analysis
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  ACTIVE
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center text-gray-700">
                  <span className="font-medium w-24">Region:</span>
                  <span className="text-gray-900">northamerica-northeast1 (Montreal, Canada)</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="font-medium w-24">Purpose:</span>
                  <span className="text-gray-900">SOAP note generation, clinical analysis, treatment plan suggestions</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="font-medium w-24">Data Type:</span>
                  <span className="text-gray-900">Pseudonymized clinical transcripts and structured test data</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="font-medium w-24">Compliance:</span>
                  <span className="text-gray-900">PHIPA, PIPEDA</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <a 
                  href="https://cloud.google.com/security/compliance/soc2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Google Cloud SOC 2 report (provider) →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Data Infrastructure */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Data Infrastructure
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            All infrastructure components are hosted in Canadian regions to ensure
            complete data sovereignty and compliance with PHIPA and PIPEDA.
          </p>
          <div className="space-y-3">
            <div className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Firestore Database</p>
                <p className="text-sm text-gray-600">Region: northamerica-northeast1 (Montreal, Canada)</p>
                <p className="text-sm text-gray-600">Purpose: Session data, SOAP notes, treatment plans, analytics events</p>
              </div>
            </div>
            <div className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Firebase Storage</p>
                <p className="text-sm text-gray-600">Region: northamerica-northeast1 (Montreal, Canada)</p>
                <p className="text-sm text-gray-600">Purpose: Audio recordings, patient documents, attachments</p>
              </div>
            </div>
            <div className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Firebase Authentication</p>
                <p className="text-sm text-gray-600">Region: northamerica-northeast1 (Montreal, Canada)</p>
                <p className="text-sm text-gray-600">Purpose: User authentication, session management, access control</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Practices */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Security Practices & Audit Logging
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            We implement security practices guided by industry standards to ensure
            appropriate data protection and regulatory compliance.
          </p>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">PHIPA Compliance</h3>
              <p className="text-sm text-gray-600 mb-3">
                Full compliance with Ontario's Personal Health Information Protection Act.
                Comprehensive legal framework and technical safeguards implemented.
              </p>
              <a 
                href="/docs/north/LEGAL_DELIVERY_FRAMEWORK.md" 
                target="_blank"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Framework →
              </a>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Audit Logging</h3>
              <p className="text-sm text-gray-600 mb-3">
                Comprehensive audit logging and security monitoring for all data access,
                modifications, and transfers. Logs retained per regulatory requirements.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-2">Security Approach</h3>
              <p className="text-sm text-gray-600 mb-3">
                We rely on major cloud providers' security programs and maintain internal security controls 
                (access controls, audit logging, encryption, monitoring). We may pursue third-party assessments 
                as the product matures.
              </p>
            </div>
          </div>
        </section>

        {/* Competitive Advantage Section */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            Why Transparency Matters
          </h2>
          <p className="text-blue-800 mb-4">
            Unlike other EMR solutions, we provide complete transparency about our AI processors,
            data infrastructure, and security certifications. This transparency is:
          </p>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>CPO Required:</strong> Ontario physiotherapists must know who processes their patients' data</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>PHIPA Compliant:</strong> Explicit disclosure of third-party processors is required</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Competitive Advantage:</strong> Jane.app and others don't provide this level of transparency</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Trust Building:</strong> Patients and practitioners deserve to know where their data is processed</span>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Last updated: November 2025</p>
          <p className="mt-2">
            Questions about our transparency report?{' '}
            <a href="mailto:compliance@aiduxcare.com" className="text-blue-600 hover:text-blue-800">
              Contact our compliance team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

