import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MCPContextViewer from '@/shared/components/MCP/MCPContextViewer';
import { MCPContext } from '@/core/mcp/schema';
import { getContextFromVisit } from '@/core/mcp/MCPContextBuilder';
import { visitDataSourceSupabase } from '@/core/dataSources/visitDataSourceSupabase';

const VisitDetailPage = () => {
  const { id: visitId } = useParams<{ id: string }>();
  const [context, setContext] = useState<MCPContext | null>(null);
  const [previousContext, setPreviousContext] = useState<MCPContext | null>(null);

  useEffect(() => {
    if (!visitId) return;

    const fetchContext = async () => {
      const visit = await visitDataSourceSupabase.getVisitById(visitId);
      const patientId = visit?.patient_id;
      if (!visit || !patientId) return;
      const ctx = await getContextFromVisit(visitId, patientId);
      setContext(ctx);
      setPreviousContext(ctx);
    };

    fetchContext();
  }, [visitId]);

  if (!visitId) {
    return <div>Visit ID is missing</div>;
  }

  if (!context) {
    return <div>Cargando contexto...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Detalle de Visita {visitId}</h1>

      {/* SUCCESS: Se pasa correctamente el contexto */}
      <MCPContextViewer context={context} />
    </div>
  );
};

export default VisitDetailPage;
