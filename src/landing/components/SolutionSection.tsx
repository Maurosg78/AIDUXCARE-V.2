import React from 'react';

export default function SolutionSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-900">
            Turn your session into a
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {' '}
              structured clinical note
            </span>
            . Automatically.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            AiDuxCare captures the clinical conversation, converts it into a transcript,
            and generates structured SOAP documentation — ready for review and insurance-grade records.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 border border-slate-200 rounded-2xl bg-white/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 ease-out">
            <img
              src="/landing/card-physio.png"
              alt="Physiotherapist and patient during consultation"
              className="w-full h-40 rounded-xl object-cover mb-4"
            />
            <h3 className="font-semibold text-lg">Capture the clinical conversation</h3>
            <p className="mt-2 text-gray-600">
              Record the session or dictate key findings. AiDuxCare converts speech
              into a secure clinical transcript.
            </p>
          </div>

          <div className="p-6 border border-slate-200 rounded-2xl bg-white/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 ease-out">
            <img
              src="/landing/card-tablet.png"
              alt="Clinician using a tablet to review clinical data"
              className="w-full h-40 rounded-xl object-cover mb-4"
            />
            <h3 className="font-semibold text-lg">AI structures the clinical note</h3>
            <p className="mt-2 text-gray-600">
              The system organizes information into SOAP format and highlights
              key findings and treatment plans.
            </p>
          </div>

          <div className="p-6 border border-slate-200 rounded-2xl bg-white/90 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 ease-out">
            <img
              src="/landing/card-consent.png"
              alt="Signed documentation representing approved clinical notes"
              className="w-full h-40 rounded-xl object-cover mb-4"
            />
            <h3 className="font-semibold text-lg">You review and approve</h3>
            <p className="mt-2 text-gray-600">
              The physiotherapist always remains in control. Every note is
              reviewed before being saved.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

