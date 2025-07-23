import React, { useState, useEffect } from 'react';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FirestoreAuditLogger } from '../core/audit/FirestoreAuditLogger';

const VerifyEmailPage: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const user = getAuth().currentUser;
  const navigate = useNavigate();

  // Efecto para refrescar el usuario y detectar verificación
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;
    const checkVerification = async () => {
      if (user) {
        await user.reload();
        setIsVerified(user.emailVerified);
        if (user.emailVerified) {
          setMessage('¡Email verificado! Redirigiendo...');
          setTimeout(() => navigate('/login'), 1500);
        }
      }
    };
    interval = setInterval(checkVerification, 2000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, navigate]);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (user) {
        await sendEmailVerification(user);
        await FirestoreAuditLogger.logEvent({
          type: 'verification_email_resent',
          userId: user.uid,
          userRole: 'unknown',
          metadata: { email: user.email },
        });
        setMessage('Correo de verificación reenviado exitosamente. Revisa tu bandeja de entrada.');
      } else {
        setError('No se encontró usuario autenticado.');
      }
    } catch (err) {
      setError('Error al reenviar el correo de verificación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fdfc] px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 mt-12 border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-[#5DA5A3] mb-4">¡Correo verificado!</h1>
          <p className="mb-4">Tu correo ha sido verificado correctamente. Ahora puedes iniciar sesión con tu cuenta profesional.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#5DA5A3] hover:bg-[#48918f] text-white font-semibold py-2 px-6 rounded transition-colors mt-2"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fdfc] px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 mt-12 border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-[#5DA5A3] mb-4">Verifica tu correo electrónico</h1>
        <p className="text-center text-slate-700 mb-6">
          Para activar tu cuenta profesional, revisa tu correo y haz clic en el enlace de verificación que te hemos enviado.<br />
          <span className="font-semibold">No podrás acceder a la plataforma hasta completar este paso.</span>
        </p>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleResend}
            disabled={loading}
            className="aidux-btn-secondary w-full py-2 px-6 rounded font-semibold transition-colors disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? 'Enviando...' : 'Reenviar correo de verificación'}
          </button>
          {message && <div className="text-green-700 text-sm mt-2">{message}</div>}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>
        <div className="mt-8 text-xs text-center text-slate-500">
          Si no encuentras el correo, revisa tu carpeta de spam o promociones.<br />
          ¿Problemas? Contáctanos en <a href="mailto:soporte@aiduxcare.com" className="underline">soporte@aiduxcare.com</a>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 