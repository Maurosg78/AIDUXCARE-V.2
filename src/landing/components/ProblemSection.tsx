import React from 'react';

export default function ProblemSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center">
          Documentation shouldn&apos;t take
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {' '}
            longer than the session itself
          </span>
        </h2>

        <p className="text-center text-gray-600 mt-4 max-w-2xl mx-auto">
          Physiotherapists need detailed clinical documentation for compliance and insurance,
          but manual note-taking consumes valuable treatment time.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 border border-slate-200 rounded-2xl bg-white/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 ease-out">
            <h3 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Time per session
            </h3>
            <p className="mt-3 text-2xl font-semibold text-slate-900">15–20 minutes</p>
            <p className="text-gray-600 mt-2">
              Average time spent writing notes after each session.
            </p>
          </div>

          <div className="p-6 border border-slate-200 rounded-2xl bg-white/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 ease-out">
            <h3 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Admin load
            </h3>
            <p className="mt-3 text-2xl font-semibold text-slate-900">40%</p>
            <p className="text-gray-600 mt-2">
              Of clinical time goes to administrative tasks.
            </p>
          </div>

          <div className="p-6 border border-slate-200 rounded-2xl bg-white/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-300 ease-out">
            <h3 className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Clinician impact
            </h3>
            <p className="mt-3 text-2xl font-semibold text-slate-900">Burnout risk</p>
            <p className="text-gray-600 mt-2">
              Repetitive documentation contributes to clinician fatigue.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

