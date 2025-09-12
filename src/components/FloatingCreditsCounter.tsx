import React from 'react';
import { Zap } from 'lucide-react';

interface FloatingCreditsCounterProps {
  current: number;
  total: number;
}

export const FloatingCreditsCounter: React.FC<FloatingCreditsCounterProps> = ({ 
  current, 
  total 
}) => {
  const percentage = (current / total) * 100;
  const isLow = percentage < 20;
  const isMedium = percentage < 50;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm
        ${isLow ? 'bg-red-500/90 text-white' : 
          isMedium ? 'bg-yellow-500/90 text-white' : 
          'bg-gray-800/90 text-white'}
        transition-all duration-300 hover:scale-105
      `}>
        <Zap className="w-4 h-4" />
        <span className="font-medium text-sm">
          {current}/{total}
        </span>
      </div>
    </div>
  );
};
