import React, { useMemo, useState } from 'react';
import NoteActions from '@/components/NoteActions';

// Lista de notas (placeholder)
export const NotesListPage = () => <div>Notes List</div>;

// Vista de detalle con botón de firmado (integración mínima)
export const NoteDetailPage = ({ id }: { id: string }) => {
  // TODO: Reemplazar por fetch real del repositorio de notas
  // Ejemplo de datos simulados (status 'submitted' para habilitar el botón)
  const [status, setStatus] = useState<'draft' | 'submitted' | 'signed'>('submitted');
  const soap = useMemo(() => ({
    subjective: 'Paciente refiere dolor lumbar intermitente.',
    objective: 'Movilidad lumbar reducida, prueba de Schober positiva.',
    assessment: 'Lumbalgia mecánica probable.',
    plan: 'Ejercicios de movilidad + educación postural. Reevaluar en 1-2 semanas.'
  }), []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Note Detail</h1>
        <div className="text-sm text-slate-600">ID: {id}</div>
      </header>

      {/* Acciones de la nota (incluye SignNoteModal internamente) */}
      <NoteActions
        noteId={id}
        status={status}
        soap={soap}
        onSigned={() => {
          // Refrescar visualmente el estado al completar el firmado
          setStatus('signed');
        }}
      />

      {/* Vista simple del contenido */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-medium text-slate-900 mb-2">SOAP</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div><strong>Subjective:</strong> {soap.subjective}</div>
          <div><strong>Objective:</strong> {soap.objective}</div>
          <div><strong>Assessment:</strong> {soap.assessment}</div>
          <div><strong>Plan:</strong> {soap.plan}</div>
        </div>
        <div className="mt-4 text-xs text-slate-600">Status actual: {status}</div>
      </section>
    </div>
  );
};
