import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FirebaseAuthService } from '../core/auth/firebaseAuthService';
import { FirestoreAuditLogger } from '../core/audit/FirestoreAuditLogger';

const authService = new FirebaseAuthService();

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Agregar un estado para controlar si la sesión es demo
  const [isDemo, setIsDemo] = useState(false);
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const [verifyEmailLoading, setVerifyEmailLoading] = useState(false);
  const [verifyEmailSuccess, setVerifyEmailSuccess] = useState<string | null>(null);
  const [verifyEmailError, setVerifyEmailError] = useState<string | null>(null);

  // Logging para verificar que el componente se monta sin redirección
  useEffect(() => {
    console.log('🔍 [DEBUG] LoginPage: Componente montado en /login');
    console.log('🔍 [DEBUG] LoginPage: Estado de autenticación actual:', {
      hasPrefillEmail: !!location.state?.prefillEmail,
      hasPrefillPassword: !!location.state?.prefillPassword,
      from: location.state?.from?.pathname || '/'
    });
  }, [location.state]);

  // Pre-llenar credenciales si vienen de la página de acceso
  useEffect(() => {
    if (location.state?.prefillEmail) {
      setEmail(location.state.prefillEmail);
    }
    if (location.state?.prefillPassword) {
      setPassword(location.state.prefillPassword);
    }
  }, [location.state]);

  // Si viene de una ruta protegida, obtener la URL original
  // const from = location.state?.from?.pathname || '/';

  // ELIMINADO: useEffect que causaba redirección automática
  // Esto permitirá que el usuario permanezca en /login sin importar el estado de autenticación

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const userProfile = await authService.signIn(email, password);
      if (userProfile) {
        // Log de login exitoso
        await FirestoreAuditLogger.logEvent({
          type: 'login_success',
          userId: userProfile.id,
          userRole: userProfile.role || 'unknown',
          metadata: { email },
        });
        
        // SOLUCIÓN: Redirigir a una página específica en lugar de regresar a AccessPage
        console.log('🔍 [DEBUG] Login exitoso, redirigiendo a página principal');
        navigate('/professional-workflow', { replace: true });
      }
    } catch (error: unknown) {
      const err = error as Error;
      // Log de login fallido
      await FirestoreAuditLogger.logEvent({
        type: 'login_failed',
        userId: 'anonymous',
        userRole: 'unknown',
        metadata: { email, error: err.message },
      });
      if (err.message.includes('auth/wrong-password') || err.message.includes('auth/user-not-found')) {
        setError('Credenciales incorrectas. Por favor');
      } else if (err.message.includes('auth/network-request-failed')) {
        setError('Error de conexión con el servidor. Por favor, verifica tu conexión a internet.');
      } else if (err.message === 'Email no verificado') {
        setShowVerifyPrompt(true);
        setError(null);
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
      console.error('Error al iniciar sesión:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifyEmailLoading(true);
    setVerifyEmailSuccess(null);
    setVerifyEmailError(null);
    try {
      await authService.sendVerificationEmail(email);
      setVerifyEmailSuccess('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (err: unknown) {
      setVerifyEmailError((err as Error).message || 'Error al reenviar verificación');
    } finally {
      setVerifyEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-boneWhite px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slateBlue">AiDuxCare</h1>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slateBlue">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-slateBlue/70">
            Accede a tu cuenta para gestionar pacientes y consultas
          </p>
        </div>
        {error && (
          <div className="bg-softCoral/10 border-l-4 border-softCoral p-4">
            <p className="text-softCoral">{error}</p>
          </div>
        )}
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
        <form
          onSubmit={handleLogin}
          className="space-y-6"
          data-testid="login-form"
        >
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue placeholder:text-neutralGray focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue placeholder:text-neutralGray focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full justify-center rounded-md bg-softCoral px-3 py-3 text-sm font-semibold text-white hover:bg-intersectionGreen focus:outline-none focus:ring-2 focus:ring-intersectionGreen focus:ring-offset-2 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
        <div className="flex flex-col items-center gap-2 mt-4">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium">¿Olvidaste tu contraseña?</Link>
          <Link to="/mfa-guide" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Configurar MFA</Link>
        </div>
        <div className="flex flex-col items-center mt-4">
          <button
            type="button"
            className="w-full rounded-md bg-intersectionGreen px-3 py-3 text-sm font-semibold text-white hover:bg-softCoral focus:outline-none focus:ring-2 focus:ring-intersectionGreen focus:ring-offset-2 transition-colors mb-2"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                // Usuario demo temporal
                const demoEmail = 'demo-temporal@aiduxcare.com';
                const demoPassword = 'demoTemporal2025!';
                const userProfile = await authService.signIn(demoEmail, demoPassword);
                if (userProfile) {
                  await FirestoreAuditLogger.logEvent({
                    type: 'login_success',
                    userId: userProfile.id,
                    userRole: userProfile.role || 'demo',
                    metadata: { email: demoEmail, demo: true },
                  });
                  navigate('/professional-workflow', { replace: true, state: { demo: true } });
                  setIsDemo(true); // Setear el estado para mostrar el banner
                }
              } catch (error: unknown) {
                setError('No se pudo iniciar sesión demo. Contacta a soporte.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? 'Iniciando demo...' : 'Probar demo (válido 14 días)'}
          </button>
          {isDemo && (
            <div className="text-xs text-center text-slate-500 mt-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Esta sesión demo es temporal, válida por 14 días y con permisos limitados.</span>
            </div>
          )}
        </div>
        <div className="text-center mt-6">
          <p className="text-base text-slateBlue/90 font-semibold">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-bold text-softCoral hover:text-intersectionGreen transition-colors underline">
              Regístrate
            </Link>
          </p>
        </div>
        
        {/* Botón para limpiar sesión (solución temporal) */}
        <div className="text-center mt-4">
          <button
            onClick={async () => {
              try {
                await authService.signOut();
                console.log('🔍 [DEBUG] Sesión cerrada manualmente');
                window.location.reload();
              } catch (error) {
                console.error('❌ Error cerrando sesión:', error);
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-300 rounded"
          >
            🗑️ Limpiar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 