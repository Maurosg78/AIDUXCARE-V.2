import { useState } from 'react';
import { Card, Button } from '../shared/ui';
import { Plus, X } from 'lucide-react';

interface CustomTestInputProps {
  onAddTests: (tests: string[]) => void;
}

export const CustomTestInput: React.FC<CustomTestInputProps> = ({ onAddTests }) => {
  const [customTests, setCustomTests] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTest = () => {
    if (inputValue.trim()) {
      const newTests = [...customTests, inputValue.trim()];
      setCustomTests(newTests);
      onAddTests(newTests);
      setInputValue('');
    }
  };

  const removeTest = (index: number) => {
    const newTests = customTests.filter((_, i) => i !== index);
    setCustomTests(newTests);
    onAddTests(newTests);
  };

  return (
    <Card className="p-3">
      <h4 className="font-semibold text-sm mb-2">Tests Adicionales</h4>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTest()}
          placeholder="Ej: Test de Unterberger, Prueba de Romberg..."
          className="flex-1 px-2 py-1 border rounded text-sm"
        />
        <Button onClick={addTest} size="sm" variant="outline">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      
      {customTests.length > 0 && (
        <div className="space-y-1">
          {customTests.map((test, index) => (
            <div key={index} className="flex items-center justify-between bg-purple-50 px-2 py-1 rounded text-sm">
              <span>{test}</span>
              <button onClick={() => removeTest(index)} className="text-red-500 hover:text-red-700">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Agrega tests específicos según tu criterio clínico
      </p>
    </Card>
  );
};
