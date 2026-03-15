import React from 'react';
import ProblemSection from '../components/ProblemSection';
import SolutionSection from '../components/SolutionSection';
import HowItWorksSection from '../components/HowItWorksSection';
import TrustSection from '../components/TrustSection';
import PilotCtaSection from '../components/PilotCtaSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-50 via-indigo-50 to-purple-50 border border-slate-200/60 shadow-sm">
          {/* Top bar for brand lockup */}
          <div className="flex items-center px-8 pt-6 pb-4 gap-3">
            <div className="h-8 px-4 rounded-full bg-white/80 border border-white/80 flex items-center gap-2">
              <img
                src="/landing/logo-aiduxcare.png"
                alt="AiduxCare"
                className="h-5 w-auto"
              />
              <span className="text-xs font-medium text-slate-500">— Canada</span>
            </div>
          </div>

          <div className="px-8 pb-10 grid md:grid-cols-2 gap-10 items-center">
            <div className="max-w-xl">
              <p className="text-sm font-medium mb-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Now in pilot testing — Ontario, Canada
              </p>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Clinical documentation,
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {' '}
                  done in seconds.
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-700">
                AiDuxCare is an AI-powered clinical documentation assistant designed for physiotherapists.
                Generate structured SOAP notes while staying compliant with Canadian healthcare standards.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:from-blue-600 hover:to-purple-600 transition-colors">
                  Join Pilot Program
                </button>

                <button className="border border-slate-300 bg-white/80 px-6 py-3 rounded-lg font-medium text-slate-800 hover:bg-white">
                  See how it works
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
                <span>PHIPA-aligned</span>
                <span>SOAP-structured notes</span>
                <span>Notes in under 60 seconds</span>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Trusted by physiotherapists in Ontario pilot testing.
              </p>
            </div>

            {/* VIDEO placeholder */}
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-white/40 bg-gradient-to-br from-indigo-900 to-blue-900">
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/95 text-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">▶</span>
                  </div>
                  <p className="text-sm opacity-80">Watch the 40-second demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <TrustSection />
      <PilotCtaSection />
    </div>
  );
}
