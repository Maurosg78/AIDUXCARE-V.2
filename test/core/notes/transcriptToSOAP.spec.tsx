import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  transcriptToChecklist,
  type AnalysisResultsLike,
} from '@/core/notes/transcriptToSOAP';
import { SOAPNotePreview } from '@/components/visits/SOAPNotePreview';

// --- mapper tests ---

describe('transcriptToChecklist (mapper)', () => {
  it('returns [] when analysis is missing or has no entities', () => {
    expect(transcriptToChecklist(undefined)).toEqual([]);
    const empty: AnalysisResultsLike = { entities: [] };
    expect(transcriptToChecklist(empty)).toEqual([]);
  });

  it('maps supported entity types into ChecklistSignal[]', () => {
    const analysis: AnalysisResultsLike = {
      entities: [
        { type: 'symptom', text: 'right hip pain', actor: 'patient' },
        { type: 'test', text: 'FABER positive', actor: 'clinician' },
        { type: 'medication', text: 'metformin' }, // ignored
      ],
    };
    const checklist = transcriptToChecklist(analysis);
    expect(checklist.length).toBe(2);
    expect(checklist[0]).toMatchObject({
      speaker: 'patient',
      text: 'right hip pain',
      tag: 'symptom',
    });
    expect(checklist[1]).toMatchObject({
      speaker: 'clinician',
      text: 'FABER positive',
      tag: 'test',
    });
  });
});

// --- preview state tests ---

describe('SOAPNotePreview (states)', () => {
  it('shows pending when analysisResults is undefined', () => {
    render(<SOAPNotePreview transcript="dummy" analysisResults={undefined} />);
    expect(screen.getByText('⏳ Analyzing...')).toBeTruthy();
  });

  it('shows empty when analysisResults has no structurable entities', () => {
    render(<SOAPNotePreview transcript="dummy" analysisResults={{ entities: [] }} />);
    expect(screen.getByText('No clinically structurable information')).toBeTruthy();
  });

  it('shows SOAP sections when content is available', () => {
    const analysis: AnalysisResultsLike = {
      entities: [{ type: 'symptom', text: 'right hip pain', actor: 'patient' }],
    };
    render(<SOAPNotePreview transcript="dummy" analysisResults={analysis} />);
    expect(screen.getByText('SOAP preview')).toBeTruthy();
    expect(screen.getByText('S - Subjective')).toBeTruthy();
    expect(screen.getByText('right hip pain')).toBeTruthy();
  });
});
