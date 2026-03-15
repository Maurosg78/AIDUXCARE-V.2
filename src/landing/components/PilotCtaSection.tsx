import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function PilotCtaSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clinicType, setClinicType] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === 'submitting') return;

    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.');
      return;
    }

    try {
      setStatus('submitting');
      await addDoc(collection(db, 'pilot_waitlist'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        clinic_size: clinicType || null,
        location: location || null,
        created_at: serverTimestamp(),
      });
      setStatus('success');
      setName('');
      setEmail('');
      setClinicType('');
      setLocation('');
    } catch (e) {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold text-gray-900">
            Join the Ontario pilot
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {' '}
              program
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            AiDuxCare is currently being tested with physiotherapists in Ontario. Request early access
            and help shape the future of clinical documentation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-6 sm:px-8 sm:py-8 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Clinic type
              </label>
              <select
                value={clinicType}
                onChange={(e) => setClinicType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an option</option>
                <option value="solo_practice">Solo practice</option>
                <option value="small_clinic">Small clinic (2–5 clinicians)</option>
                <option value="medium_clinic">Medium clinic (6–15 clinicians)</option>
                <option value="large_clinic">Large clinic (&gt; 15 clinicians)</option>
                <option value="hospital_or_network">Hospital / Health system</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location (city, province)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Niagara, ON"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
          {status === 'success' && !error && (
            <p className="text-sm text-emerald-600">
              Thank you. We&apos;ll be in touch with pilot details.
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm hover:from-blue-600 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              {status === 'submitting' ? 'Sending...' : 'Request early access'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

