import { describe, expect, it } from 'vitest';

import {
  getPatientStatus,
  isEncounterClosed,
  isSessionActive,
  PatientWorkflowStatus,
  type PatientWorkflowInput,
} from '../patientStatus';

function createInput(overrides: Partial<PatientWorkflowInput> = {}): PatientWorkflowInput {
  const input: PatientWorkflowInput = {
    hasAppointment: false,
    appointmentStatus: undefined,
    hasSession: false,
    sessionStatus: undefined,
    hasEncounter: false,
    hasConsultation: false,
    soapStatus: null,
    encounterClosed: false,
    ...overrides,
  };

  return input;
}

describe('patientStatus', () => {
  it('returns CANCELLED for cancelled appointment without clinical activity', () => {
    const input = createInput({
      hasAppointment: true,
      appointmentStatus: 'cancelled',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.CANCELLED);
  });

  it('does not return CANCELLED when appointment is cancelled but clinical activity exists', () => {
    const input = createInput({
      hasAppointment: true,
      appointmentStatus: 'cancelled',
      hasSession: true,
      sessionStatus: 'in_progress',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.IN_PROGRESS);
  });

  it('returns DOCUMENTED_FINAL for encounter plus finalized soap', () => {
    const input = createInput({
      hasEncounter: true,
      hasConsultation: true,
      soapStatus: 'finalized',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.DOCUMENTED_FINAL);
  });

  it('returns DOCUMENTED_FINAL for closed encounter without consultation', () => {
    const input = createInput({
      hasEncounter: true,
      encounterClosed: true,
      hasConsultation: false,
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.DOCUMENTED_FINAL);
  });

  it('returns DOCUMENTED_DRAFT for encounter without finalized soap', () => {
    const input = createInput({
      hasEncounter: true,
      hasConsultation: false,
      encounterClosed: false,
      soapStatus: null,
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.DOCUMENTED_DRAFT);
  });

  it('returns DOCUMENTED_DRAFT for consultation without encounter', () => {
    const input = createInput({
      hasConsultation: true,
      soapStatus: 'draft',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.DOCUMENTED_DRAFT);
  });

  it('returns DOCUMENTED_DRAFT over IN_PROGRESS when consultation and active session coexist', () => {
    const input = createInput({
      hasConsultation: true,
      soapStatus: 'draft',
      hasSession: true,
      sessionStatus: 'in_progress',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.DOCUMENTED_DRAFT);
  });

  it('returns IN_PROGRESS for active session without encounter or consultation', () => {
    const input = createInput({
      hasSession: true,
      sessionStatus: 'in_progress',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.IN_PROGRESS);
  });

  it('returns ABANDONED for inactive session without encounter or consultation', () => {
    const input = createInput({
      hasSession: true,
      sessionStatus: 'completed',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.ABANDONED);
  });

  it('returns SCHEDULED for appointment without any activity', () => {
    const input = createInput({
      hasAppointment: true,
      appointmentStatus: 'scheduled',
    });
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.SCHEDULED);
  });

  it('falls back to SCHEDULED when no data exists', () => {
    const input = createInput();
    const status = getPatientStatus(input);

    expect(status).toBe(PatientWorkflowStatus.SCHEDULED);
  });

  it('treats interrupted session as active', () => {
    const input = createInput({
      sessionStatus: 'interrupted',
    });
    const status = isSessionActive(input);

    expect(status).toBe(true);
  });

  it('treats completed session as inactive', () => {
    const input = createInput({
      sessionStatus: 'completed',
    });
    const status = isSessionActive(input);

    expect(status).toBe(false);
  });

  it('recognizes closed encounter only when encounter exists and closed flag is true', () => {
    const input = createInput({
      hasEncounter: true,
      encounterClosed: true,
    });
    const status = isEncounterClosed(input);

    expect(status).toBe(true);
  });
});
