
export const PatientListPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Pacientes
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Gestionar y buscar pacientes del sistema
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nuevo Paciente
          </button>
        </div>
        
        <div className="border rounded-lg">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Pacientes
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">
              Aquí se mostrará la lista de pacientes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientListPage;
