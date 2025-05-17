import React from 'react';

interface ActionPanelProps {
  visitId: string;
  patientId: string;
  hasPreviousVisits: boolean;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ visitId, patientId, hasPreviousVisits }) => {
  return (
    <div className="flex space-x-2">
      <button
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        onClick={() => console.log(`Guardando visita ${visitId} para paciente ${patientId}`)}
      >
        Guardar
      </button>
      {hasPreviousVisits && (
        <button
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Comparar
        </button>
      )}
    </div>
  );
};

export default ActionPanel; 