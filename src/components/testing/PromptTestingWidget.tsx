/**
 * 🧪 Prompt Testing Widget - Control A/B Testing
 * Widget para que Mauricio pueda alternar entre prompts durante user testing
 */

import React, { useState } from 'react';
import { Button } from '../../shared/components/UI/Button';

interface PromptTestingWidgetProps {
  className?: string;
}

export const PromptTestingWidget: React.FC<PromptTestingWidgetProps> = ({
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg"
          title="Abrir controles de testing"
        >
          🧪
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🧪 Prompt Testing</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="text-gray-600 text-sm">Widget de testing deshabilitado temporalmente por refactor.</div>
    </div>
  );
};

export default PromptTestingWidget; 