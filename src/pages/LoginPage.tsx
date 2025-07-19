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
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
      console.error('Error al iniciar sesión:', err.message);
    } finally {
      setLoading(false);
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
        <div className="text-center mt-4">
          <p className="text-sm text-slateBlue/70">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-softCoral hover:text-intersectionGreen transition-colors">
              Regístrate
            </Link>
          </p>
        </div>
        {/* Credenciales de demostración */}
        <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-sm font-medium text-slateBlue mb-2">Credenciales de demostración:</h3>
          <p className="text-xs text-slateBlue/70 mb-1">Profesional: demo@aiduxcare.com / password123</p>
          <p className="text-xs text-slateBlue/70 mb-1">Paciente: paciente@aiduxcare.com / password123</p>
          <p className="text-xs text-slateBlue/70 mb-1">Admin: admin@aiduxcare.com / password123</p>
          <p className="text-xs text-slateBlue/70">Mauricio: maurosg.2023@gmail.com / Mauro7812#</p>
        </div>
        {/* Botón para volver al acceso directo */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Volver al acceso directo
          </Link>
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