/**
 * @fileoverview Componente PasswordStrengthIndicator enterprise
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import React from 'react';
import { PasswordStrength } from '@/types/wizard';

export interface PasswordStrengthIndicatorProps {
  password: string;
  strength: PasswordStrength;
  showIndicator?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  strength,
  showIndicator = true
}) => {
  if (!showIndicator || !password) return null;

  const strengthConfig = {
    weak: {
      label: 'Débil',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      width: 'w-1/3'
    },
    medium: {
      label: 'Media',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      width: 'w-2/3'
    },
    strong: {
      label: 'Fuerte',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      width: 'w-full'
    }
  };

  const config = strengthConfig[strength];

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Fortaleza de la contraseña</span>
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-300 ${config.color} ${config.width}`}
          role="progressbar"
          aria-valuenow={strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        <ul className="list-disc list-inside space-y-1">
          <li className={password.length >= 8 ? 'text-green-600' : ''}>
            Mínimo 8 caracteres
          </li>
          <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
            Al menos una minúscula
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
            Al menos una mayúscula
          </li>
          <li className={/\d/.test(password) ? 'text-green-600' : ''}>
            Al menos un número
          </li>
          <li className={/[@$!%*?&]/.test(password) ? 'text-green-600' : ''}>
            Al menos un carácter especial
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator; 