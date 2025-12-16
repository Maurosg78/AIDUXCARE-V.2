/**
 * 🏥 Professional Onboarding Page (Firebase user creation + compliance capture)
 * Market: CA | Language: en-CA | Compliance: PHIPA / PIPEDA / SOC2
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import logger from '@/shared/utils/logger';

const ProfessionalOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = (location.state as any)?.email || '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);

      logger.info('New professional registered:', { email, licenseNumber });
      navigate('/verify-email', { state: { email } });
    } catch (err: any) {
      logger.error('Registration error:', err);
      setError('Unable to complete registration. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E10098] via-pink-500 to-[#0072FF] px-4 sm:px-6 lg:px-8 font-sans">
      <div className="relative w-full max-w-md space-y-8 z-10 bg-white/80 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
          Professional Registration
        </h2>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="First name" required className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input type="text" placeholder="Last name" required className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input type="email" placeholder="Email address" required className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="text" placeholder="License number" required className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />

          <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-[#E10098] to-[#0072FF] hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-all">
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalOnboardingPage;
