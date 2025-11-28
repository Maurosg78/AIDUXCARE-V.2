import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
          where('date', '<', weekEnd)
        );
        
        // Ordenar después de obtener los datos para evitar problemas de índice
        const snapshot = await getDocs(q);
        const appointmentsData: Appointment[] = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              patientName: data.patientName || 'No name',
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
              time: data.time || '10:00',
              duration: data.duration || 45,
              type: data.type || 'Consultation',
              status: data.status || 'confirmed'
            };
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        setAppointments(appointmentsData);
      } catch (error) {
        logger.error('Error loading appointments:', error);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Week Header */}
      <div className="bg-gradient-to-r from-primary-blue to-primary-purple text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold font-apple">Weekly Schedule</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors font-apple text-sm"
            >
              ← Previous week
            </button>
            <span className="text-sm font-apple">
              {weekDays[0].toLocaleDateString('en-CA', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('en-CA', { day: 'numeric', month: 'long' })}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors font-apple text-sm"
            >
              Next week →
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
              {/* Day Header */}
              <div className={`p-3 text-center border-b ${isToday ? 'bg-primary-blue/10 border-primary-blue/30' : 'border-gray-200'}`}>
                <div className="text-sm text-gray-600">
                  {day.toLocaleDateString('en-CA', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-semibold ${isToday ? 'text-primary-blue' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Day Appointments */}
              <div className="p-2 space-y-2">
                {dayAppointments.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No appointments
                  </div>
                ) : (
                  dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-gradient-to-r from-primary-blue/10 to-primary-purple/10 border-l-4 border-primary-blue p-2 rounded text-xs"
                    >
                      <div className="font-medium text-primary-blue">
                        {formatTime(apt.time)}
                      </div>
                      <div className="text-gray-700 truncate">
                        {apt.patientName}
                      </div>
                      <div className="text-primary-purple">
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
