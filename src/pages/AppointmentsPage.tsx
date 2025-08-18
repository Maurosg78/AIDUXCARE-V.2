import React from 'react';
import { WeeklyAgenda } from '../features/appointments/components/WeeklyAgenda';

interface AppointmentsPageProps {
  id?: string;
}

export const AppointmentListPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Citas
      </h1>
      <div className="mb-6">
        <p className="text-gray-600">
          Crear y administrar citas médicas
        </p>
      </div>
      
      {/* Agenda Semanal */}
      <WeeklyAgenda />
      
      {/* Lista de Citas (placeholder) */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Lista de Citas
          </h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-center py-8">
            Aquí se mostrará la lista detallada de citas
          </p>
        </div>
      </div>
    </div>
  );
};

export const AppointmentDetailPage: React.FC<AppointmentsPageProps> = ({ id }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Detalle de Cita
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">ID de la cita: {id}</p>
        <p className="text-gray-600 mt-4">
          Esta es la vista de detalle de una cita médica específica.
        </p>
      </div>
    </div>
  );
};

export default AppointmentListPage;
