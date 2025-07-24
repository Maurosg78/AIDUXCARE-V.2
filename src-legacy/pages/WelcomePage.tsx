import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthService } from '../core/auth/firebaseAuthService';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

interface RegistrationForm {
  name: string;
  email: string;
  password: string;
}

interface LoginForm {
  email: string;
  password: string;
}

const authService = new FirebaseAuthService();

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  // Login state
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  // Registration state
  const [regForm, setRegForm] = useState<RegistrationForm>({ name: '', email: '', password: '' });
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean>(false);
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const [verifyEmailLoading, setVerifyEmailLoading] = useState(false);
  const [verifyEmailSuccess, setVerifyEmailSuccess] = useState<string | null>(null);
  const [verifyEmailError, setVerifyEmailError] = useState<string | null>(null);

  // Lógica de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const userProfile = await authService.signIn(loginForm.email, loginForm.password);
      if (userProfile && userProfile.emailVerified) {
        navigate('/professional-workflow');
      } else if (userProfile && !userProfile.emailVerified) {
        setShowVerifyPrompt(true);
        navigate('/verify-email', { state: { email: loginForm.email } });
      }
    } catch (err: unknown) {
      setLoginError((err as Error).message || 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  // Lógica de registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    setEmailExists(false);
    try {
      // Eliminar validación de email único (checkEmailExists)
      // Crear usuario y enviar verificación
      await authService.signUp(regForm.email, regForm.password, regForm.name);
      setVerificationSent(true);
    } catch (err: unknown) {
      setRegError((err as Error).message || 'Error al registrar');
    } finally {
      setRegLoading(false);
    }
  };

  // Handlers de input
  const handleLoginInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };
  const handleRegInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
    if (e.target.name === 'email') setEmailExists(false);
  };

  const handleResendVerification = async () => {
    setVerifyEmailLoading(true);
    setVerifyEmailSuccess(null);
    setVerifyEmailError(null);
    try {
      await authService.sendVerificationEmail(loginForm.email);
      setVerifyEmailSuccess('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (err: unknown) {
      setVerifyEmailError((err as Error).message || 'Error al reenviar verificación');
    } finally {
      setVerifyEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-boneWhite px-4">
      <header className="w-full flex justify-center py-8">
        <AiDuxCareLogo size="md" />
      </header>
      <main className="w-full max-w-5xl flex flex-col md:flex-row gap-8 bg-white rounded-lg shadow-lg p-8">
        {/* Panel Login */}
        <section className="flex-1 border-r border-neutralGray pr-8">
          <h2 className="text-2xl font-bold mb-4 text-aidux-primary">Acceso Profesional</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" name="email" value={loginForm.email} onChange={handleLoginInput} required placeholder="Correo electrónico" className="w-full p-2 border rounded" />
            <input type="password" name="password" value={loginForm.password} onChange={handleLoginInput} required placeholder="Contraseña" className="w-full p-2 border rounded" />
            {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
            {showVerifyPrompt && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 my-2">
                <p className="text-yellow-800">Debes verificar tu email para acceder.</p>
                <button type="button" className="aidux-btn-secondary mt-2" onClick={handleResendVerification} disabled={verifyEmailLoading}>
                  {verifyEmailLoading ? 'Enviando...' : 'Reenviar correo de verificación'}
                </button>
                {verifyEmailSuccess && <div className="text-green-700 text-xs mt-1">{verifyEmailSuccess}</div>}
                {verifyEmailError && <div className="text-red-600 text-xs mt-1">{verifyEmailError}</div>}
              </div>
            )}
            <button type="submit" disabled={loginLoading} className="aidux-btn-primary w-full">{loginLoading ? 'Accediendo...' : 'Iniciar sesión'}</button>
          </form>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" className="aidux-btn-secondary w-full" onClick={() => navigate('/forgot-password')}>¿Olvidaste tu contraseña?</button>
            <button type="button" className="aidux-btn-secondary w-full" onClick={() => navigate('/mfa-guide')}>Configurar MFA</button>
          </div>
        </section>
        {/* Panel Registro */}
        <section className="flex-1 pl-8">
          <h2 className="text-2xl font-bold mb-4 text-aidux-primary">Registro Profesional</h2>
          {verificationSent ? (
            <div className="text-green-700 font-medium">Se ha enviado un correo de verificación. Por favor revisa tu bandeja de entrada.</div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" name="name" value={regForm.name} onChange={handleRegInput} required placeholder="Nombre completo" className="w-full p-2 border rounded" />
              <input type="email" name="email" value={regForm.email} onChange={handleRegInput} required placeholder="Correo electrónico" className={`w-full p-2 border rounded ${emailExists ? 'border-red-500' : ''}`} />
              <input type="password" name="password" value={regForm.password} onChange={handleRegInput} required placeholder="Contraseña" className="w-full p-2 border rounded" />
              {regError && <div className="text-red-600 text-sm">{regError}</div>}
              <button type="submit" disabled={regLoading} className="aidux-btn-primary w-full">{regLoading ? 'Registrando...' : 'Registrarse'}</button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
};

export default WelcomePage; 