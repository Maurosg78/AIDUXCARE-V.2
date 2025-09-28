// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';

import logger from '@/shared/utils/logger';

interface Appointment {
  id: string;
  patientName: string;
  date: Date;
  time: string;
  duration: number;
  type: string;
  status: string;
}

export const WeeklyAgenda: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Generar días de la semana
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Cargar citas de la semana
  useEffect(() => {
    const loadAppointments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const weekStart = new Date(currentWeek);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);

        const appointmentsRef = collection(db, 'appointments');
        const q = query(
          appointmentsRef,
          where('clinicianUid', '==', user.uid),
          where('date', '>=', weekStart),
          where('date', '<', weekEnd),
          orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        const appointmentsData: Appointment[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            patientName: data.patientName || 'Sin nombre',
            date: data.date.toDate(),
            time: data.time || '10:00',
            duration: data.duration || 45,
            type: data.type || 'Consulta',
            status: data.status || 'confirmed'
          };
        });

        setAppointments(appointmentsData);
      } catch (error) {
        logger.error('Error cargando citas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user, currentWeek]);

  const weekDays = getWeekDays(currentWeek);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(newWeek.getDate() - 7);
    } else {
      newWeek.setDate(newWeek.getDate() + 7);
    }
    setCurrentWeek(newWeek);
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header de la semana */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Agenda Semanal</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              ← Semana anterior
            </button>
            <span className="text-sm">
              {weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Siguiente semana →
            </button>
          </div>
        </div>
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div key={index} className="bg-white min-h-[200px]">
              {/* Header del día */}
              <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                <div className="text-sm text-gray-600">
                  {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Citas del día */}
              <div className="p-2 space-y-2">
                {dayAppointments.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">
                    Sin citas
                  </div>
                ) : (
                  dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-xs"
                    >
                      <div className="font-medium text-blue-900">
                        {formatTime(apt.time)}
                      </div>
                      <div className="text-blue-700 truncate">
                        {apt.patientName}
                      </div>
                      <div className="text-blue-600">
                        {apt.duration} min
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};