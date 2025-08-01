/**
 * @fileoverview Componente ConsentCheckbox enterprise
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import React from 'react';
import { ConsentCheckboxProps } from '@/types/wizard';
import { getCheckboxAccessibilityProps } from '@/utils/accessibility';

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  error,
  required = false,
  disabled = false
}) => {
  const errorId = error ? `${id}-error` : undefined;
  
  const accessibilityProps = getCheckboxAccessibilityProps(
    id,
    !!error,
    required,
    disabled
  );

  return (
    <div className="flex items-start space-x-3 mb-4">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        aria-describedby={errorId}
        {...accessibilityProps}
      />
      
      <div className="flex-1">
        <label 
          htmlFor={id} 
          className="text-sm text-gray-700 leading-relaxed"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {error && (
          <p id={errorId} className="text-red-500 text-xs mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConsentCheckbox; 