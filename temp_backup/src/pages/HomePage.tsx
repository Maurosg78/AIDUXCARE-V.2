import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="text-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido a AiDuxCare V.2</h1>
      <p className="text-gray-600 mb-8">Sistema de gestión clínica inteligente</p>
      
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="py-4 px-6 bg-blue-500 text-white">
          <h2 className="text-xl font-bold">Demo Clínica Integrada</h2>
          <p className="text-sm mt-1">Escucha activa, sugerencias IA y documentación clínica</p>
        </div>
        <div className="py-6 px-6">
          <p className="text-gray-700 mb-4">
            Accede a nuestra demostración completa del asistente clínico con todos los módulos integrados:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
            <li>Escucha activa de consulta médica</li>
            <li>Sugerencias inteligentes basadas en contexto</li>
            <li>Documentación asistida en EMR</li>
            <li>Métricas de eficiencia clínica</li>
          </ul>
          <Link 
            to="/demo" 
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded text-center transition-colors"
          >
            Iniciar Demo Clínica
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 