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
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  // Campos profesionales adicionales
  const [professionalData, setProfessionalData] = useState({
    specialty: '',
    subSpecialty: '',
    yearsExperience: 0,
    age: 0,
    city: '',
    country: 'España',
    hourlyRate: 0,
    patientTypes: [] as string[],
    certifications: [] as string[],
    languages: ['Español'] as string[]
  });

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

    // Validación específica para profesionales
    if (role === 'professional') {
      if (!professionalData.specialty || !professionalData.yearsExperience || !professionalData.city) {
        setError('Para profesionales, completa todos los campos obligatorios');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      // Usar el servicio de usuarios para registrar
      const data = await userDataSourceSupabase.signUp();

      if (data?.user) {
        // Si es profesional, guardar datos adicionales
        if (role === 'professional') {
          // Aquí se guardarían los datos profesionales en el perfil
          console.log('Datos profesionales a guardar:', professionalData);
        }
        
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

            {/* Campos adicionales para profesionales */}
            {role === 'professional' && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-slateBlue">Información Profesional</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slateBlue mb-1">
                      Especialidad *
                    </label>
                    <select
                      value={professionalData.specialty}
                      onChange={(e) => setProfessionalData(prev => ({ ...prev, specialty: e.target.value }))}
                      className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                    >
                      <option value="">Selecciona especialidad</option>
                      <option value="Fisioterapia">Fisioterapia</option>
                      <option value="Medicina Deportiva">Medicina Deportiva</option>
                      <option value="Traumatología">Traumatología</option>
                      <option value="Rehabilitación">Rehabilitación</option>
                      <option value="Medicina Familiar">Medicina Familiar</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slateBlue mb-1">
                      Años de experiencia *
                    </label>
                    <input
                      type="number"
                      value={professionalData.yearsExperience}
                      onChange={(e) => setProfessionalData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) }))}
                      className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                      placeholder="Ej: 5"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slateBlue mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={professionalData.city}
                      onChange={(e) => setProfessionalData(prev => ({ ...prev, city: e.target.value }))}
                      className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                      placeholder="Ej: Madrid"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slateBlue mb-1">
                      Tarifa horaria (€)
                    </label>
                    <input
                      type="number"
                      value={professionalData.hourlyRate}
                      onChange={(e) => setProfessionalData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                      className="relative block w-full rounded-md border border-neutralGray p-3 text-slateBlue focus:ring-2 focus:ring-intersectionGreen focus:border-intersectionGreen sm:text-sm"
                      placeholder="Ej: 45"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            )}
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