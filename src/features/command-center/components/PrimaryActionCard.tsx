// NOTE: This component is a stub - not currently used in pilot
// CommandCenterPage.tsx (old version) references this but it's not implemented
import React from 'react';

interface PrimaryActionCardProps {
  type?: string;
  patient?: any;
  appointmentTime?: string;
  appointmentReason?: string;
  onAction?: () => void;
}

export const PrimaryActionCard: React.FC<PrimaryActionCardProps> = () => {
  return null;
};
