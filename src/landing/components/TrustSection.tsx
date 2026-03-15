import React from 'react';

export default function TrustSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-900">
            Built for Canadian clinical
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {' '}
              standards
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            AiDuxCare is designed around PHIPA / PIPEDA requirements and the way Canadian physiotherapists
            actually document care — not as a generic AI demo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16 text-sm">
          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-slate-200">
            <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src="/landing/trust-privacy.png"
                alt="Fingerprint security over laptop"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Privacy
              </p>
              <p className="mt-1 font-semibold text-slate-900">PHIPA-aligned</p>
              <p className="mt-2 text-slate-600">
                Built against Ontario&apos;s health privacy framework and internal compliance checklists.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-slate-200">
            <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src="/landing/trust-canada.png"
                alt="Canadian flag key and checkmark key on keyboard"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Data residency
              </p>
              <p className="mt-1 font-semibold text-slate-900">Processed in Canada</p>
              <p className="mt-2 text-slate-600">
                Clinical data is processed and stored in Canadian regions to respect residency requirements.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-slate-200">
            <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src="/landing/trust-checklist.png"
                alt="Checklist icon with blank document"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Clinical control
              </p>
              <p className="mt-1 font-semibold text-slate-900">Physiotherapist review</p>
              <p className="mt-2 text-slate-600">
                Every note is reviewed and approved by the clinician before it becomes part of the record.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-slate-200">
            <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src="/landing/trust-soap.png"
                alt="Clinician writing notes on a clipboard"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Documentation
              </p>
              <p className="mt-1 font-semibold text-slate-900">Structured SOAP</p>
              <p className="mt-2 text-slate-600">
                Output is organized as clear S / O / A / P sections ready for insurance-grade documentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

