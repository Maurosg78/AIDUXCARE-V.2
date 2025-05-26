import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userDataSourceSupabase, RoleType } from '../core/services/userDataSourceSupabase';

const RegisterPage = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleType>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!fullname || !email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Usar el servicio de usuarios para registrar
      const data = await userDataSourceSupabase.signUp(email, password, {
        full_name: fullname,
        role
      });

      if (data?.user) {
        // Mostrar mensaje de éxito y redirigir al login
        alert('Registro exitoso. Por favor inicia sesión.');
        navigate('/login');
      }
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message || 'Error al registrar usuario');
      console.error('Error al registrar usuario:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-boneWhite px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slateBlue">AiDuxCare</h1>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slateBlue">Registro</h2>
          <p className="mt-2 text-sm text-slateBlue/70">
            Crea una cuenta para acceder al sistema
          </p>
        </div>
        
        {error && (
          <div className="bg-softCoral/10 border-l-4 border-softCoral p-4">
            <p className="text-softCoral">{error}</p>
          </div>
        )}
        
        <form
          onSubmit={handleRegister}
          className="space-y-6"
          data-testid="register-form"
        >
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="fullname" className="sr-only">
                Nombre completo
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                required
                className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue placeholder:text-neutralGray focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                placeholder="Nombre completo"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
            </div>
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
                autoComplete="new-password"
                required
                className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue placeholder:text-neutralGray focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slateBlue mb-1">
                Tipo de cuenta
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
              >
                <option value="patient">Paciente</option>
                <option value="professional">Profesional sanitario</option>
              </select>
              <p className="mt-1 text-xs text-slateBlue/70">
                Nota: Las cuentas de administrador solo pueden ser creadas por el administrador del sistema.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full justify-center rounded-md bg-softCoral px-3 py-3 text-sm font-semibold text-white hover:bg-intersectionGreen focus:outline-none focus:ring-2 focus:ring-intersectionGreen focus:ring-offset-2 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slateBlue/70">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-softCoral hover:text-intersectionGreen transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 