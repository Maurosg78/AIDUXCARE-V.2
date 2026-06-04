import { describe, expect, it } from 'vitest';
import {
  inferMimeFromName,
  isAttachmentEligibleForClinicalAI,
  type ClinicalAttachment,
  type AttachmentPatientIdentityStatus,
} from '../clinicalAttachmentService';

function buildAttachment(patientIdentityStatus: AttachmentPatientIdentityStatus): ClinicalAttachment {
  return {
    id: 'attachment-1',
    name: 'report.pdf',
    size: 100,
    contentType: 'application/pdf',
    storagePath: 'clinical-attachments/test/report.pdf',
    downloadURL: 'https://example.com/report.pdf',
    uploadedAt: new Date().toISOString(),
    patientIdentityStatus,
  };
}

describe('inferMimeFromName', () => {
  it('infers common image mime types when browser file.type is empty', () => {
    const jpgMime = inferMimeFromName('radiografia.jpg');
    const jpegMime = inferMimeFromName('radiografia.JPEG');
    const pngMime = inferMimeFromName('captura_rx.png');
    const webpMime = inferMimeFromName('foto.webp');
    const heicMime = inferMimeFromName('imagen.heic');
    const heifMime = inferMimeFromName('imagen.heif');

    expect(jpgMime).toBe('image/jpeg');
    expect(jpegMime).toBe('image/jpeg');
    expect(pngMime).toBe('image/png');
    expect(webpMime).toBe('image/webp');
    expect(heicMime).toBe('image/heic');
    expect(heifMime).toBe('image/heif');
  });

  it('returns null for unknown extensions', () => {
    const unknownMime = inferMimeFromName('archivo.xyz');

    expect(unknownMime).toBeNull();
  });
});

describe('isAttachmentEligibleForClinicalAI', () => {
  it('excludes suspected mismatch attachments from clinical AI', () => {
    const attachment = buildAttachment('suspected_mismatch');

    expect(isAttachmentEligibleForClinicalAI(attachment)).toBe(false);
  });

  it('allows attachments after explicit clinician confirmation', () => {
    const attachment = buildAttachment('confirmed_by_clinician');

    expect(isAttachmentEligibleForClinicalAI(attachment)).toBe(true);
  });

  it('allows attachments when no explicit patient name was detected', () => {
    const attachment = buildAttachment('no_name_detected');

    expect(isAttachmentEligibleForClinicalAI(attachment)).toBe(true);
  });
});
