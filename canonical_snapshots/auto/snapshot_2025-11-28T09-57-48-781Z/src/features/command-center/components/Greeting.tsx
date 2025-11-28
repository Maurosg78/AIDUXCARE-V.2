import React from 'react';
import { Timestamp } from 'firebase/firestore';

import { useProfessionalProfile } from '../../../context/ProfessionalProfileContext';

interface GreetingProps {
  className?: string;
}

export const Greeting: React.FC<GreetingProps> = ({ className = '' }) => {
  const { profile, loading } = useProfessionalProfile();

  // Function to get greeting based on time of day (using local time)
  const getGreeting = (): string => {
    const now = new Date();
    const localHour = now.getHours(); // getHours() already returns local time
    
    if (localHour >= 5 && localHour < 12) return 'Good morning';
    if (localHour >= 12 && localHour < 17) return 'Good afternoon';
    if (localHour >= 17 && localHour < 21) return 'Good evening';
    return 'Good night'; // 21:00 - 04:59
  };

  // Function to format last access date
  const formatLastAccess = (timestamp: Date | Timestamp | undefined): string => {
    if (!timestamp) return 'First time';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return new Intl.DateTimeFormat('en-CA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (_error) {
      return 'Recent';
    }
  };

  // Function to get timezone
  const getTimezone = (): string => {
    if (profile?.timezone) {
      return profile.timezone;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  // Function to get display name
  const getDisplayName = (): string => {
    if (profile?.preferredSalutation && profile?.lastNamePreferred) {
      return `${profile.preferredSalutation} ${profile.lastNamePreferred}`;
    }
    if (profile?.displayName) return profile.displayName;
    if (profile?.email) {
      const emailName = profile.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'User';
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
        <h1 className="text-2xl font-semibold mb-1">Command Center</h1>
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const greeting = getGreeting();
  const displayName = getDisplayName();
  const timezone = getTimezone();
  const lastAccess = formatLastAccess(profile.lastLoginAt);

  return (
    <div className={`space-y-2 ${className}`}>
      <h1 className="text-2xl font-light text-gray-900 font-apple tracking-[-0.02em]">
        {greeting},{' '}
        <span className="bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent font-medium">
          {displayName}
        </span>
      </h1>
      
      <div className="space-y-1 text-gray-600">
        {profile.specialty && (
          <p className="text-sm font-apple font-light">
            {profile.specialty}
            {profile.clinic?.city && ` • ${profile.clinic.city}`}
            {profile.clinic?.country && `, ${profile.clinic.country}`}
          </p>
        )}
        
        <p className="text-sm font-apple font-light">
          {profile.email}
        </p>
        
        <p className="text-sm text-gray-500 font-apple font-light">
          You are in your secure space. Last access: {lastAccess} ({timezone})
        </p>
      </div>
    </div>
  );
};
