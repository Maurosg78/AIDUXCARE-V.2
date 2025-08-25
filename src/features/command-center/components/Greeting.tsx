import React from 'react';
import { Timestamp } from 'firebase/firestore';

import { useProfessionalProfile } from '../../../context/ProfessionalProfileContext';

interface GreetingProps {
  className?: string;
}

export const Greeting: React.FC<GreetingProps> = ({ className = '' }) => {
  const { profile, loading } = useProfessionalProfile();

  // Función para obtener saludo según la hora del día
  const getSaludo = (now: Date): string => {
    const h = now.getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Función para formatear fecha de último acceso
  const formatLastAccess = (timestamp: Date | Timestamp | undefined): string => {
    if (!timestamp) return 'Primera vez';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (_error) {
      return 'Reciente';
    }
  };

  // Función para obtener zona horaria
  const getTimezone = (): string => {
    if (profile?.timezone) {
      return profile.timezone;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  // Función para obtener nombre de visualización
  const getDisplayName = (): string => {
    if (profile?.preferredSalutation && profile?.lastNamePreferred) {
      return `${profile.preferredSalutation} ${profile.lastNamePreferred}`;
    }
    if (profile?.displayName) return profile.displayName;
    if (profile?.email) {
      const emailName = profile.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Usuario';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-7 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-64 mb-1"></div>
        <div className="h-4 bg-slate-200 rounded w-56"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`text-slate-600 ${className}`}>
        <h1 className="text-2xl font-semibold mb-1">Centro de Mando</h1>
        <p className="text-slate-500">Cargando perfil...</p>
      </div>
    );
  }

  const saludo = getSaludo(new Date());
  const displayName = getDisplayName();
  const timezone = getTimezone();
  const lastAccess = formatLastAccess(profile.lastLoginAt);

  return (
    <div className={`space-y-2 ${className}`}>
      <h1 className="text-2xl font-semibold text-slate-900">
        {saludo}, {displayName}
      </h1>
      
      <div className="space-y-1 text-slate-600">
        {profile.specialty && (
          <p className="text-sm">
            {profile.specialty}
            {profile.clinic?.city && ` • ${profile.clinic.city}`}
            {profile.clinic?.country && `, ${profile.clinic.country}`}
          </p>
        )}
        
        <p className="text-sm">
          {profile.email}
        </p>
        
        <p className="text-sm text-slate-500">
          Estás en tu espacio seguro. Último acceso: {lastAccess} ({timezone})
        </p>
      </div>
    </div>
  );
};
