import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PatientWorkflowStatus } from '../../../../domain/patientStatus';
import type { PatientListItem } from '../../hooks/usePatientsList';
import type { TodayQuickItem } from '../../components/TodayPatientsPanel';
import {
  buildClinicalDayView,
  resolveClinicalDayRowsForOpenResponsibilities,
} from '../clinicalDayView';

vi.mock('../../../../repositories/encountersRepo', () => ({
  encountersRepo: {
    getEncountersByPatient: vi.fn(),
  },
}));

vi.mock('../../../../services/PersistenceService', () => ({
  PersistenceService: {
    getNotesByPatient: vi.fn(),
  },
}));

import { encountersRepo } from '../../../../repositories/encountersRepo';
import { PersistenceService } from '../../../../services/PersistenceService';

const mockGetEncountersByPatient = vi.mocked(encountersRepo.getEncountersByPatient);
const mockGetNotesByPatient = vi.mocked(PersistenceService.getNotesByPatient);

function buildPatient(overrides: Partial<PatientListItem> = {}): PatientListItem {
  return {
    id: 'patient-001',
    firstName: 'Ryan',
    lastName: 'Murdock',
    fullName: 'Ryan Murdock',
    ...overrides,
  };
}

function buildQuickItem(overrides: Partial<TodayQuickItem> = {}): TodayQuickItem {
  return {
    patientId: 'patient-001',
    patientName: 'Ryan Murdock',
    sessionType: 'followup',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetEncountersByPatient.mockResolvedValue([]);
  mockGetNotesByPatient.mockResolvedValue([]);
});

describe('buildClinicalDayView', () => {
  it('shows a patient added from search as scheduled in the selected day queue', async () => {
    const rows = await buildClinicalDayView(
      new Date('2026-07-15T12:00:00'),
      [buildPatient()],
      {
        appointments: [],
        sessions: [],
        quickItems: [buildQuickItem()],
      }
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      patientId: 'patient-001',
      patientName: 'Ryan Murdock',
      status: PatientWorkflowStatus.SCHEDULED,
      hasEncounter: false,
      hasSession: false,
      hasConsultation: false,
      sessionType: 'followup',
    });
    expect(rows[0]?.rawData.hasAppointment).toBe(true);
  });

  it('keeps automatic open-responsibility rows hidden when there is no explicit manual add', async () => {
    const rows = await buildClinicalDayView(
      new Date('2026-07-15T12:00:00'),
      [buildPatient()],
      {
        appointments: [],
        sessions: [],
        quickItems: [buildQuickItem()],
      }
    );
    const openResponsibilityPatientIds = new Set(['patient-001']);

    const resolvedRows = resolveClinicalDayRowsForOpenResponsibilities(
      rows,
      openResponsibilityPatientIds
    );

    expect(rows[0]?.status).toBe(PatientWorkflowStatus.SCHEDULED);
    expect(rows[0]?.addedManuallyToday).toBeUndefined();
    expect(resolvedRows).toHaveLength(0);
  });

  it('shows a manually added patient in Por atender even when an open responsibility exists', async () => {
    const rows = await buildClinicalDayView(
      new Date('2026-07-15T12:00:00'),
      [
        buildPatient({
          id: 'Js4Dx0RO3lJAiDTGPwH9',
          firstName: 'Adrian',
          lastName: 'Sawyer',
          fullName: 'Adrian Jameel Sawyer',
        }),
      ],
      {
        appointments: [],
        sessions: [],
        quickItems: [
          buildQuickItem({
            patientId: 'Js4Dx0RO3lJAiDTGPwH9',
            patientName: 'Adrian Jameel Sawyer',
            addedManuallyToday: true,
          }),
        ],
      }
    );
    const openResponsibilityPatientIds = new Set(['Js4Dx0RO3lJAiDTGPwH9']);

    const resolvedRows = resolveClinicalDayRowsForOpenResponsibilities(
      rows,
      openResponsibilityPatientIds
    );

    expect(rows[0]?.status).toBe(PatientWorkflowStatus.SCHEDULED);
    expect(rows[0]?.addedManuallyToday).toBe(true);
    expect(resolvedRows).toHaveLength(1);
    expect(resolvedRows[0]?.patientName).toBe('Adrian Jameel Sawyer');
  });
});
