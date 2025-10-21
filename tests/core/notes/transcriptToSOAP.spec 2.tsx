import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { transcriptToChecklist } from '../../../src/core/notes/transcriptToSOAP';
import { SOAPNotePreview } from '../../../src/components/visits/SOAPNotePreview';

describe('transcriptToChecklist', () => {
  it('returns [] when analysis is missing or has no entities', () => {
    expect(transcriptToChecklist(undefined as any)).toEqual([]);
    expect(transcriptToChecklist({ entities: [] })).toEqual([]);
  });

  it('maps valid entities to ChecklistSignal with correct tags and speakers', () => {
    const analysis = {
      entities: [
        { type: 'symptom', text: 'Right hip pain 7/10', actor: 'patient' },
        { type: 'test', text: 'FABER positive right', actor: 'clinician' },
        { type: 'diagnosis', text: 'Hip osteoarthritis suspected', actor: 'clinician' },
        { type: 'plan', text: 'Start gentle ROM exercises', actor: 'clinician' },
        { type: 'medication', text: 'Gabapentin' } // ignored (not structurable)
      ]
    };
    const out = transcriptToChecklist(analysis);
    expect(out.length).toBe(4);
    expect(out[0]).toMatchObject({ tag: 'symptom', text: 'Right hip pain 7/10', speaker: 'patient' });
    expect(out[1]).toMatchObject({ tag: 'test', text: 'FABER positive right', speaker: 'clinician' });
    expect(out[2]).toMatchObject({ tag: 'diagnosis', text: 'Hip osteoarthritis suspected' });
    expect(out[3]).toMatchObject({ tag: 'plan', text: 'Start gentle ROM exercises' });
  });
});

describe('SOAPNotePreview states', () => {
  it('renders pending, empty, and ready states', () => {
    const { rerender } = render(<SOAPNotePreview analysisResults={undefined as any} />);
    expect(screen.getByText(/Analizando/i)).toBeTruthy();

    rerender(<SOAPNotePreview analysisResults={{ entities: [] }} />);
    expect(screen.getByText(/No hay información clínica estructurable/i)).toBeTruthy();

    rerender(
      <SOAPNotePreview analysisResults={{ entities: [{ type: 'symptom', text: 'Hip pain', actor: 'patient' }] }} />
    );
    expect(screen.getByText(/SOAP preview/i)).toBeTruthy();
    expect(screen.getByText(/Hip pain/i)).toBeTruthy();
  });
});
