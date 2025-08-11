import React from 'react';
import { Appointment } from '../hooks/useAppointmentSchedule';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
  onCreateAppointment?: () => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  loading,
  error,
  selectedDate,
  onDateChange,
  onCreateAppointment
}) => {
  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-internal-success/10 text-internal-success border-internal-success/20';
      case 'scheduled':
        return 'bg-internal-accent/10 text-internal-accent border-internal-accent/20';
      case 'completed':
        return 'bg-internal-text-secondary/10 text-internal-text-secondary border-internal-text-secondary/20';
      case 'cancelled':
        return 'bg-internal-error/10 text-internal-error border-internal-error/20';
      default:
        return 'bg-internal-text-secondary/10 text-internal-text-secondary border-internal-text-secondary/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'scheduled':
        return 'Programada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocida';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        <span className="ml-3 text-gray-600">Cargando agenda...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-text-secondary">
          Citas para {selectedDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        {onDateChange && (
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            className="px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No hay citas programadas</p>
          <button
            onClick={onCreateAppointment}
            className="mt-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all duration-200"
          >
            Crear Cita
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appointment => (
            <div
              key={appointment.id}
              className={`p-4 rounded-lg border ${getStatusColor(appointment.status)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                  <p className="text-sm text-gray-600">
                    {formatTime(appointment.dateTime)} - {appointment.duration} min
                  </p>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {getStatusText(appointment.status)}
                </span>
              </div>

              {appointment.notes && (
                <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
