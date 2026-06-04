import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ClinicalAttachment } from '../../../services/clinicalAttachmentService';
import { TranscriptArea } from '../TranscriptArea';

const mismatchWarning =
  'Este documento parece pertenecer a otro paciente o no coincide con el paciente activo. Confirma manualmente antes de usarlo en el análisis clínico.';

const buildAttachment = (
  patientIdentityStatus: ClinicalAttachment['patientIdentityStatus'],
  patientNameMismatchWarning: string | null,
): ClinicalAttachment => ({
  id: 'attachment-1',
  name: 'clinical-report.pdf',
  size: 1024,
  contentType: 'application/pdf',
  storagePath: 'attachments/clinical-report.pdf',
  downloadURL: 'https://example.com/clinical-report.pdf',
  uploadedAt: '2026-06-04T00:00:00.000Z',
  extractedText: 'Clinical report content',
  processingComplete: true,
  patientIdentityStatus,
  patientNameMismatchWarning,
});

const stableProps = {
  recordingTime: 0,
  isRecording: false,
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  transcript: '',
  setTranscript: vi.fn(),
  additionalNotes: '',
  setAdditionalNotes: vi.fn(),
  transcriptError: null,
  transcriptMeta: null,
  languagePreference: 'auto' as const,
  setLanguagePreference: vi.fn(),
  mode: 'live' as const,
  setMode: vi.fn(),
  isTranscribing: false,
  isProcessing: false,
  isGeneratingSOAP: false,
  audioStream: null,
  handleAnalyzeWithVertex: vi.fn(async () => {}),
  attachments: [],
  isUploadingAttachment: false,
  attachmentError: null,
  removingAttachmentId: null,
  handleAttachmentUpload: vi.fn(async () => {}),
  handleAttachmentRemove: vi.fn(async () => {}),
  handleAttachmentReviewedToggle: vi.fn(),
  hideAnalyzeButton: true,
};

describe('TranscriptArea attachment patient identity rendering', () => {
  it('removes the mismatch warning when the same attachment is confirmed by the clinician', () => {
    const { rerender } = render(
      <TranscriptArea
        {...stableProps}
        attachments={[buildAttachment('suspected_mismatch', mismatchWarning)]}
      />,
    );

    expect(screen.getByText(mismatchWarning)).toBeInTheDocument();

    rerender(
      <TranscriptArea
        {...stableProps}
        attachments={[buildAttachment('confirmed_by_clinician', null)]}
      />,
    );

    expect(screen.queryByText(mismatchWarning)).not.toBeInTheDocument();
  });
});
