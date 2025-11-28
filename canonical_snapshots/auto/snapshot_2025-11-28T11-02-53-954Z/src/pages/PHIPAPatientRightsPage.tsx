/**
 * PHIPA Patient Rights Page
 * 
 * Official patient rights and responsibilities under PHIPA
 * (Personal Health Information Protection Act, 2004 - Ontario)
 * 
 * Public route - accessible without login
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export const PHIPAPatientRightsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Patient Rights and Responsibilities Under PHIPA
            </h1>
          </div>
          <p className="text-gray-600">
            Personal Health Information Protection Act, 2004 (Ontario)
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            The Personal Health Information Protection Act, 2004 (PHIPA) sets out rules for the collection, 
            use, and disclosure of personal health information by health information custodians in Ontario. 
            As a patient, you have specific rights and responsibilities under this legislation.
          </p>
        </div>

        {/* Patient Rights */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Your Rights as a Patient
          </h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">1. Right to Access Your Health Information</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                You have the right to request access to your personal health information held by a health 
                information custodian. The custodian must provide access within 30 days, unless an extension 
                is required.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">2. Right to Request Correction</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                You have the right to request correction of your personal health information if you believe 
                it is inaccurate or incomplete. The custodian must respond within 30 days.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">3. Right to Withdraw Consent</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                You have the right to withdraw your consent for the collection, use, or disclosure of your 
                personal health information at any time, subject to legal and contractual restrictions.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">4. Right to File a Complaint</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                You have the right to file a complaint with the Information and Privacy Commissioner of 
                Ontario (IPC) if you believe your privacy rights have been violated or your health information 
                has been mishandled.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">5. Right to Know How Your Information is Used</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                You have the right to be informed about how your personal health information is collected, 
                used, and disclosed. Health information custodians must provide notice of their information 
                practices.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">6. Right to Refuse AI-Assisted Processing</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                You have the right to refuse the use of artificial intelligence or automated processing of 
                your health information. Alternative documentation methods (manual entry) must be available.
              </p>
            </div>
          </div>
        </section>

        {/* Patient Responsibilities */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Your Responsibilities as a Patient
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-indigo-600 mt-1">•</span>
              <p className="text-gray-700 text-sm leading-relaxed">
                Provide accurate and complete health information to your healthcare providers
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-600 mt-1">•</span>
              <p className="text-gray-700 text-sm leading-relaxed">
                Inform your healthcare providers of any changes to your health information
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-600 mt-1">•</span>
              <p className="text-gray-700 text-sm leading-relaxed">
                Understand and ask questions about how your information will be used
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-600 mt-1">•</span>
              <p className="text-gray-700 text-sm leading-relaxed">
                Report any concerns about the handling of your health information
              </p>
            </div>
          </div>
        </section>

        {/* Health Information Custodian Responsibilities */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Health Information Custodian Responsibilities
          </h2>
          
          <div className="space-y-3 text-sm text-gray-700">
            <p className="leading-relaxed">
              Health information custodians (including physiotherapists and clinics) are required to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Collect, use, and disclose personal health information only as permitted by PHIPA</li>
              <li>Implement safeguards to protect your health information</li>
              <li>Provide notice of their information practices</li>
              <li>Obtain your consent before collecting, using, or disclosing your health information (with limited exceptions)</li>
              <li>Respond to your access and correction requests</li>
              <li>Maintain accurate and complete records</li>
              <li>Report privacy breaches to the IPC and affected individuals</li>
            </ul>
          </div>
        </section>

        {/* Cross-Border Processing Notice */}
        <section className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-yellow-900 mb-3">
                Cross-Border Data Processing
              </h2>
              <p className="text-yellow-800 text-sm leading-relaxed mb-3">
                If your health information is processed using artificial intelligence services located outside 
                of Canada (e.g., in the United States), you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm ml-2">
                <li>Be informed about the cross-border processing</li>
                <li>Provide explicit consent before such processing occurs</li>
                <li>Understand the risks associated with cross-border processing (e.g., US CLOUD Act)</li>
                <li>Refuse cross-border processing and request alternative methods</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How to File a Complaint */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            How to File a Complaint
          </h2>
          
          <div className="space-y-3 text-sm text-gray-700">
            <p className="leading-relaxed">
              If you believe your privacy rights have been violated, you can file a complaint with:
            </p>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="font-semibold text-gray-900 mb-2">Information and Privacy Commissioner of Ontario (IPC)</p>
              <p className="text-gray-700 mb-2">
                <strong>Website:</strong>{' '}
                <a href="https://www.ipc.on.ca" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                  https://www.ipc.on.ca
                </a>
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Phone:</strong> 1-800-387-0073
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                <a href="mailto:info@ipc.on.ca" className="text-blue-600 hover:text-blue-800 underline">
                  info@ipc.on.ca
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>This information is provided for educational purposes and is not legal advice.</p>
          <p className="mt-2">
            For the complete text of PHIPA, visit:{' '}
            <a href="https://www.ontario.ca/laws/statute/04p03" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
              Ontario.ca - PHIPA Legislation
            </a>
          </p>
          <p className="mt-4">
            Last updated: November 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default PHIPAPatientRightsPage;

