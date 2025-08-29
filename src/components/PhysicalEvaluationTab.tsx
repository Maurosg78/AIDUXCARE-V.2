import { useState } from 'react';
import { Card, Button } from '../shared/ui';

interface PhysicalEvaluationTabProps {
  suggestedTests: string[];
  onComplete: (results: any) => void;
}

export const PhysicalEvaluationTab: React.FC<PhysicalEvaluationTabProps> = ({
  suggestedTests,
  onComplete
}) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Tests Pendientes</h3>
        {suggestedTests.map((test, index) => (
          <div key={index} className={`p-2 mb-2 rounded ${
            index === currentTestIndex ? 'bg-blue-100' : 'bg-gray-50'
          }`}>
            {test.replace('📋 ', '')}
          </div>
        ))}
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Evaluación Actual</h3>
        <p>Test {currentTestIndex + 1} de {suggestedTests.length}</p>
        <Button 
          onClick={() => {
            if (currentTestIndex === suggestedTests.length - 1) {
              onComplete(results);
            } else {
              setCurrentTestIndex(currentTestIndex + 1);
            }
          }}
          className="mt-4"
        >
          {currentTestIndex === suggestedTests.length - 1 ? 'Finalizar' : 'Siguiente'}
        </Button>
      </Card>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Resultados</h3>
        <p>Completados: {results.length}</p>
      </Card>
    </div>
  );
};
