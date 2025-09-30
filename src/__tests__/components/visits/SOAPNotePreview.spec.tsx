import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SOAPNotePreview } from '../../../components/visits/SOAPNotePreview';

// Minimal mocks to isolate UI behavior
vi.mock('../../../core/notes/transcriptToSOAP', () => ({
  transcriptToChecklist: (analysis: any) =>
    Array.isArray(analysis?.entities) ? analysis.entities : [],
  buildSOAPFromAnalysis: (_analysis: any) => ({
    sections: {
      subjective: ['Patient reports shoulder pain'],
      objective: ['ROM limited in abduction'],
      assessment: ['Likely rotator cuff tendinopathy'],
      plan: ['Therapeutic exercise 3x/week'],
    },
  }),
}));

describe('SOAPNotePreview', () => {
  it('renders pending state when no analysisResults', () => {
    render(<SOAPNotePreview />);
    expect(screen.getByRole('region', { name: /SOAP Note Preview/i })).toBeInTheDocument();
    expect(screen.getByText(/Analyzing\.\.\./i)).toBeInTheDocument();
  });

  it('renders empty state when checklist is empty', () => {
    render(<SOAPNotePreview analysisResults={{ entities: [] }} />);
    expect(screen.getByText(/No clinically structurable information/i)).toBeInTheDocument();
  });

  it('renders ready state with S\/O\/A\/P lists', () => {
    render(<SOAPNotePreview analysisResults={{ entities: ['x'] }} />);
    expect(screen.getByText(/SOAP preview/i)).toBeInTheDocument();
    expect(screen.getByText(/S - Subjective/i)).toBeInTheDocument();
    expect(screen.getByText(/O - Objective/i)).toBeInTheDocument();
    expect(screen.getByText(/A - Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/P - Plan/i)).toBeInTheDocument();
  });
});
