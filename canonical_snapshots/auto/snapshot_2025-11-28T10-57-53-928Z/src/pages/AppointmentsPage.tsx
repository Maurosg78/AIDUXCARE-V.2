import React from 'react';
import { useNavigate } from 'react-router-dom';

import { WeeklyAgenda } from '../features/appointments/components/WeeklyAgenda';

interface AppointmentsPageProps {
  id?: string;
}

export const AppointmentListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Back button */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent mb-2 font-apple">
                Appointments
              </h1>
              <p className="text-gray-600 font-apple text-[15px]">
                Create and manage medical appointments
              </p>
            </div>
            <button
              onClick={() => navigate('/command-center')}
              className="px-4 py-2 text-primary-blue hover:text-primary-purple font-apple text-[15px] font-medium"
            >
              ← Back to Command Center
            </button>
          </div>
        </div>
        
        {/* Weekly Agenda */}
        <WeeklyAgenda />
        
        {/* Appointment List (placeholder) */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Appointment List
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">
              The detailed list of appointments will be shown here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppointmentDetailPage: React.FC<AppointmentsPageProps> = ({ id }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent font-apple">
            Appointment Details
          </h1>
          <button
            onClick={() => navigate('/command-center')}
            className="px-4 py-2 text-primary-blue hover:text-primary-purple font-apple text-[15px] font-medium"
          >
            ← Back to Command Center
          </button>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Appointment ID: {id}</p>
          <p className="text-gray-600 mt-4">
            This is the detail view for a specific medical appointment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentListPage;
