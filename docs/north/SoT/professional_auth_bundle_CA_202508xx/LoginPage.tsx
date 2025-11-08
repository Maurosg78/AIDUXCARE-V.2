/**
 * 🧩 AiDuxCare Professional Auth — SoT Fusion (Firebase + Corporate Branding)
 * Market: CA | Language: en-CA | Compliance: PHIPA / PIPEDA / SOC2
 * Source lineage: Firebase integration (4a0860f0) + Visual layout (8bbc6f4)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';
import logger from '@/shared/utils/logger';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/professional-workflow');
    } catch (err: any) {
      logger.error('Authentication error:', err);
      if (err.code === 'auth/user-not-found') {
        navigate('/onboarding', { state: { email } });
        return;
      }
      setError('Unable to sign in. Please verify your credentials or register first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E10098] via-pink-500 to-[#0072FF] px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-blue-50/40 to-transparent"></div>

      <div className="relative w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <AiDuxCareLogo size="lg" variant="full" className="transform hover:scale-105 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
            Sign in to AiDuxCare
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Access your professional workspace securely.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-[#E10098] to-[#0072FF] hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Connecting…' : 'Sign In'}
          </button>

          <div className="text-center text-sm text-slate-600">
            <p>
              Not a registered user yet?{' '}
              <span
                className="text-blue-600 font-medium hover:underline cursor-pointer"
                onClick={() => navigate('/onboarding')}
              >
                Register here
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
