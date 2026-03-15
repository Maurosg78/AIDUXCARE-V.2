import React from 'react';

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-900">
            How AiDuxCare works during a
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {' '}
              real session
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Capture the clinical conversation, generate a structured SOAP note,
            and review it before saving it to the patient record.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 mt-16 text-center">
          <div className="p-6 rounded-2xl bg-white/90 shadow-sm">
            <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
              <img
                src="/landing/how-1.png"
                alt="Clinician taking quick notes at the desk"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mx-auto mb-3 h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-700">
              1
            </div>
            <h3 className="font-semibold text-lg">Record the session</h3>
            <p className="mt-2 text-gray-600">
              Start recording or dictate key findings during the consultation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 shadow-sm">
            <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
              <img
                src="/landing/how-2.png"
                alt="AI-assisted writing over notebook"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mx-auto mb-3 h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-700">
              2
            </div>
            <h3 className="font-semibold text-lg">AI generates the note</h3>
            <p className="mt-2 text-gray-600">
              The transcript is automatically structured into a SOAP note.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 shadow-sm">
            <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
              <img
                src="/landing/how-3.png"
                alt="Checklist of completed tasks on a laptop"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mx-auto mb-3 h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-700">
              3
            </div>
            <h3 className="font-semibold text-lg">Review and finalize</h3>
            <p className="mt-2 text-gray-600">
              The physiotherapist reviews and approves the final documentation.
            </p>
          </div>
        </div>

        <div className="mt-16 border border-dashed border-slate-300 rounded-xl p-8 bg-white text-center text-gray-500">
          Product interface preview
        </div>
      </div>
    </section>
  );
}

