import React from 'react';
import { Button } from './Button';

interface ActionPanelProps {
  visitId: string;
  patientId: string;
  hasPreviousVisits: boolean;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ visitId, patientId, hasPreviousVisits }) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="primary"
        onClick={() => console.log(`Guardando visita ${visitId} para paciente ${patientId}`)}
      >
        Guardar
      </Button>
      {hasPreviousVisits && (
        <Button
          variant="outline"
        >
          Comparar
        </Button>
      )}
    </div>
  );
};

export default ActionPanel; 