// @ts-nocheck
import React from 'react';
import { ArrowRight, CheckSquare } from 'lucide-react';

interface DynamicTestTransferProps {
  selectedTests: any[];
  onTransfer: () => void;
  disabled?: boolean;
}

export const DynamicTestTransfer: React.FC<DynamicTestTransferProps> = ({
  selectedTests,
  onTransfer,
  disabled
}) => {
  const categorizedTests = {
    essential: selectedTests.filter(t => 
      t.text?.toLowerCase().includes('dolor') || 
      t.text?.toLowerCase().includes('fuerza')
    ),
    functional: selectedTests.filter(t => 
      t.text?.toLowerCase().includes('marcha') || 
      t.text?.toLowerCase().includes('equilibrio')
    ),
    specialized: selectedTests.filter(t => 
      !t.text?.toLowerCase().includes('dolor') && 
      !t.text?.toLowerCase().includes('fuerza') &&
      !t.text?.toLowerCase().includes('marcha') &&
      !t.text?.toLowerCase().includes('equilibrio')
    )
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Tests seleccionados para evaluación:</h4>
          
          {categorizedTests.essential.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Esenciales</p>
              <div className="pl-4 space-y-1">
                {categorizedTests.essential.map((test, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-3 h-3 text-green-600" />
                    <span>{test.text?.split(':')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {categorizedTests.functional.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Funcionales</p>
              <div className="pl-4 space-y-1">
                {categorizedTests.functional.map((test, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-3 h-3 text-blue-600" />
                    <span>{test.text?.split(':')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {categorizedTests.specialized.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Especializados</p>
              <div className="pl-4 space-y-1">
                {categorizedTests.specialized.map((test, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckSquare className="w-3 h-3 text-purple-600" />
                    <span>{test.text?.split(':')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={onTransfer}
          disabled={disabled || selectedTests.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            disabled || selectedTests.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 transform hover:scale-105'
          }`}
        >
          Continuar con {selectedTests.length} tests
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      
      {selectedTests.length === 0 && (
        <p className="text-sm text-amber-600 mt-2">
          ⚠️ Selecciona al menos un test para continuar a la evaluación física
        </p>
      )}
    </div>
  );
};