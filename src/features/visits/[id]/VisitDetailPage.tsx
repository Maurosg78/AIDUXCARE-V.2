import React from 'react';
import { useParams } from 'react-router-dom';
import IntegratedSuggestionViewer from '@/shared/components/Agent/IntegratedSuggestionViewer';

const VisitDetailPage: React.FC = () => {
  const { id: visitId } = useParams<{ id: string }>();

  if (!visitId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Error: ID de visita no encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sección de EMR */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Registro Médico Electrónico</h2>
        {/* ... existing EMR code ... */}
      </div>

      {/* Sección de Sugerencias IA Integradas */}
      <div className="mt-8">
        <IntegratedSuggestionViewer visitId={visitId} />
      </div>
    </div>
  );
};

export default VisitDetailPage; 