/**
 * 🧩 AiDuxCare Professional Auth — SoT Fusion (Firebase + Corporate Branding)
 * Market: CA | Compliance: PHIPA / PIPEDA / SOC2
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
    } catch (err) {
      logger.error('Error de autenticación:', err);
      setError('Error al iniciar sesión. Por favor verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E10098] via-pink-500 to-[#0072FF] px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-blue-50/40 to-transparent"></div>

      <div className="relative w-full max-w-md space-y-8 z-10 bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
        {/* Header corporativo */}
        <div className="text-center space-y-4">
          <AiDuxCareLogo size="lg" variant="full" className="mx-auto transform hover:scale-105 transition-transform" />
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#E10098] via-pink-500 to-[#0072FF] bg-clip-text text-transparent">
            Iniciar Sesión
          </h2>
          <p className="text-sm text-slate-600">
            Accede a tu cuenta profesional AiDuxCare
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Correo electrónico</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Correo electrónico"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-[#E10098] to-[#0072FF] hover:opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-all"
          >
            {loading ? 'Conectando…' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
