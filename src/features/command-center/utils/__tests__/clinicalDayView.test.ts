import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PatientWorkflowStatus } from '../../../../domain/patientStatus';
import type { PatientListItem } from '../../hooks/usePatientsList';
import type { TodayQuickItem } from '../../components/TodayPatientsPanel';
import {
  buildClinicalDayView,
  resolveClinicalDayRowsForOpenResponsibilities,
  resolveClinicalDayRowsForQueuePresentation,
  resolveSeenTodayRows,
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
      openResponsibilityPatientIds,
      '2026-07-15'
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
            sourceDateKey: '2026-07-14',
            addedManuallyToday: true,
            addedManuallyOnDateKey: '2026-07-15',
          }),
        ],
      }
    );
    const openResponsibilityPatientIds = new Set(['Js4Dx0RO3lJAiDTGPwH9']);

    const resolvedRows = resolveClinicalDayRowsForOpenResponsibilities(
      rows,
      openResponsibilityPatientIds,
      '2026-07-15'
    );
    const clinicalDayQueuePresentation = resolveClinicalDayRowsForQueuePresentation(
      rows,
      openResponsibilityPatientIds,
      '2026-07-15'
    );

    expect(rows[0]?.status).toBe(PatientWorkflowStatus.SCHEDULED);
    expect(rows[0]?.addedManuallyToday).toBe(true);
    expect(rows[0]?.addedManuallyOnDateKey).toBe('2026-07-15');
    expect(resolvedRows).toHaveLength(1);
    expect(resolvedRows[0]?.patientName).toBe('Adrian Jameel Sawyer');
    expect(clinicalDayQueuePresentation.todayQueueRows).toHaveLength(1);
    expect(clinicalDayQueuePresentation.carriedForwardPendingRows).toHaveLength(0);
  });

  it('classifies a carried-forward pending patient as Pendiente de cerrar instead of Por atender', async () => {
    const rows = await buildClinicalDayView(
      new Date('2026-07-15T12:00:00'),
      [
        buildPatient({
          id: 'marta-001',
          firstName: 'Marta',
          lastName: 'Santamaria',
          fullName: 'Marta Santamaria',
        }),
      ],
      {
        appointments: [],
        sessions: [],
        quickItems: [
          buildQuickItem({
            patientId: 'marta-001',
            patientName: 'Marta Santamaria',
            sessionType: 'initial',
            sourceDateKey: '2026-07-14',
          }),
        ],
      }
    );
    const openResponsibilityPatientIds = new Set<string>();

    const clinicalDayQueuePresentation = resolveClinicalDayRowsForQueuePresentation(
      rows,
      openResponsibilityPatientIds,
      '2026-07-15'
    );

    expect(rows[0]?.patientName).toBe('Marta Santamaria');
    expect(rows[0]?.sourceDateKey).toBe('2026-07-14');
    expect(rows[0]?.addedManuallyToday).toBeUndefined();
    expect(clinicalDayQueuePresentation.todayQueueRows).toHaveLength(0);
    expect(clinicalDayQueuePresentation.carriedForwardPendingRows).toHaveLength(1);
    expect(clinicalDayQueuePresentation.carriedForwardPendingRows[0]?.patientName).toBe('Marta Santamaria');
  });

  it('expires a legacy manual-add flag after the item is carried to another clinical day', async () => {
    const rows = await buildClinicalDayView(
      new Date('2026-07-22T12:00:00'),
      [buildPatient()],
      {
        appointments: [],
        sessions: [],
        quickItems: [
          buildQuickItem({
            sourceDateKey: '2026-07-21',
            addedManuallyToday: true,
          }),
        ],
      }
    );
    const openResponsibilityPatientIds = new Set<string>();

    const clinicalDayQueuePresentation = resolveClinicalDayRowsForQueuePresentation(
      rows,
      openResponsibilityPatientIds,
      '2026-07-22'
    );

    expect(clinicalDayQueuePresentation.todayQueueRows).toHaveLength(0);
    expect(clinicalDayQueuePresentation.carriedForwardPendingRows).toHaveLength(1);
  });

  it('keeps a carried item in Por atender when the clinician explicitly adds it to the presented day', async () => {
    const rows = await buildClinicalDayView(
      new Date('2026-07-22T12:00:00'),
      [buildPatient()],
      {
        appointments: [],
        sessions: [],
        quickItems: [
          buildQuickItem({
            sourceDateKey: '2026-07-20',
            addedManuallyToday: true,
            addedManuallyOnDateKey: '2026-07-22',
          }),
        ],
      }
    );
    const openResponsibilityPatientIds = new Set(['patient-001']);

    const clinicalDayQueuePresentation = resolveClinicalDayRowsForQueuePresentation(
      rows,
      openResponsibilityPatientIds,
      '2026-07-22'
    );

    expect(clinicalDayQueuePresentation.todayQueueRows).toHaveLength(1);
    expect(clinicalDayQueuePresentation.carriedForwardPendingRows).toHaveLength(0);
  });

  it('keeps the real Adrian and Renan carry-forwards out of Cola de hoy on 22 July', async () => {
    const rows = await buildClinicalDayView(
      new Date('2026-07-22T12:00:00'),
      [
        buildPatient({
          id: 'Js4Dx0RO3lJAiDTGPwH9',
          firstName: 'Adrian',
          lastName: 'Sawyer',
          fullName: 'Adrian Jameel Sawyer',
        }),
        buildPatient({
          id: 'XBGFTJihiRk5tg6icO7k',
          firstName: 'Renan',
          lastName: 'Moshe',
          fullName: 'Renan Ben Moshe',
        }),
      ],
      {
        appointments: [],
        sessions: [],
        quickItems: [
          buildQuickItem({
            patientId: 'Js4Dx0RO3lJAiDTGPwH9',
            patientName: 'Adrian Jameel Sawyer',
            sourceDateKey: '2026-07-15',
            addedManuallyToday: true,
          }),
          buildQuickItem({
            patientId: 'XBGFTJihiRk5tg6icO7k',
            patientName: 'Renan Ben Moshe',
            sourceDateKey: '2026-07-20',
            addedManuallyToday: true,
          }),
        ],
      }
    );
    const openResponsibilityPatientIds = new Set(['Js4Dx0RO3lJAiDTGPwH9']);

    const clinicalDayQueuePresentation = resolveClinicalDayRowsForQueuePresentation(
      rows,
      openResponsibilityPatientIds,
      '2026-07-22'
    );
    const carriedForwardPatientNames = clinicalDayQueuePresentation.carriedForwardPendingRows.map(
      (row) => row.patientName
    );

    expect(clinicalDayQueuePresentation.todayQueueRows).toHaveLength(0);
    expect(carriedForwardPatientNames).toEqual([
      'Adrian Jameel Sawyer',
      'Renan Ben Moshe',
    ]);
  });

  it('classifies the completed Renan encounter as seen today while Adrian and Gary remain pending', async () => {
    mockGetEncountersByPatient.mockImplementation(async (patientId) => {
      if (patientId !== 'XBGFTJihiRk5tg6icO7k') {
        return [];
      }

      return [
        {
          id: 'ly3lzla0fXTjD33kfWGK',
          patientId: 'XBGFTJihiRk5tg6icO7k',
          sessionId: 'ff0w27nBbmMoVe1MnUOKq7gKEd32-1784715449083',
          authorUid: 'ff0w27nBbmMoVe1MnUOKq7gKEd32',
          status: 'completed',
          encounterDate: {
            toDate: () => new Date('2026-07-22T10:00:00.000Z'),
          },
          createdAt: {
            toDate: () => new Date('2026-07-22T10:18:49.829Z'),
          },
          updatedAt: {
            toDate: () => new Date('2026-07-22T10:18:49.829Z'),
          },
        },
      ] as Awaited<ReturnType<typeof encountersRepo.getEncountersByPatient>>;
    });

    const rows = await buildClinicalDayView(
      new Date('2026-07-22T12:00:00'),
      [
        buildPatient({
          id: 'XBGFTJihiRk5tg6icO7k',
          firstName: 'Renan',
          lastName: 'Moshe',
          fullName: 'Renan Ben Moshe',
        }),
        buildPatient({
          id: 'Js4Dx0RO3lJAiDTGPwH9',
          firstName: 'Adrian',
          lastName: 'Sawyer',
          fullName: 'Adrian Jameel Sawyer',
        }),
        buildPatient({
          id: 'gary-001',
          firstName: 'Gary',
          lastName: 'Goff',
          fullName: 'Gary Goff',
        }),
      ],
      {
        appointments: [],
        sessions: [],
        quickItems: [
          buildQuickItem({
            patientId: 'XBGFTJihiRk5tg6icO7k',
            patientName: 'Renan Ben Moshe',
            sourceDateKey: '2026-07-20',
            addedManuallyToday: true,
          }),
          buildQuickItem({
            patientId: 'Js4Dx0RO3lJAiDTGPwH9',
            patientName: 'Adrian Jameel Sawyer',
            sourceDateKey: '2026-07-15',
            addedManuallyToday: true,
          }),
          buildQuickItem({
            patientId: 'gary-001',
            patientName: 'Gary Goff',
            sourceDateKey: '2026-07-13',
          }),
        ],
      }
    );
    const presentation = resolveClinicalDayRowsForQueuePresentation(
      rows,
      new Set<string>(),
      '2026-07-22'
    );
    const seenTodayRows = resolveSeenTodayRows(rows);

    expect(seenTodayRows.map((row) => row.patientName)).toEqual(['Renan Ben Moshe']);
    expect(seenTodayRows[0]).toMatchObject({
      status: PatientWorkflowStatus.DOCUMENTED_FINAL,
      hasClosedClinicalEvidenceForDate: true,
    });
    expect(presentation.todayQueueRows.map((row) => row.patientName)).toEqual(['Renan Ben Moshe']);
    expect(presentation.carriedForwardPendingRows.map((row) => row.patientName)).toEqual([
      'Adrian Jameel Sawyer',
      'Gary Goff',
    ]);
  });

  it('treats a finalized consultation for the presented date as closed clinical evidence', async () => {
    mockGetNotesByPatient.mockResolvedValue([
      {
        id: 'note-followup-001',
        patientId: 'patient-001',
        sessionId: 'session-followup-001',
        clinicalDate: '2026-07-22',
        soapData: {
          subjective: 'S',
          objective: 'O',
          assessment: 'A',
          plan: 'P',
          confidence: 0.85,
          timestamp: '2026-07-22T10:00:00.000Z',
        },
        encryptedData: {
          iv: 'iv',
          encryptedData: 'encrypted',
        },
        createdAt: '2026-07-22T10:00:00.000Z',
        updatedAt: '2026-07-22T10:01:00.000Z',
        ownerUid: 'owner-001',
        status: 'finalized',
      },
    ]);

    const rows = await buildClinicalDayView(
      new Date('2026-07-22T12:00:00'),
      [buildPatient()],
      {
        appointments: [],
        sessions: [],
        quickItems: [
          buildQuickItem({
            sourceDateKey: '2026-07-20',
          }),
        ],
      }
    );
    const presentation = resolveClinicalDayRowsForQueuePresentation(
      rows,
      new Set<string>(),
      '2026-07-22'
    );

    expect(resolveSeenTodayRows(rows)).toHaveLength(1);
    expect(presentation.todayQueueRows).toHaveLength(1);
    expect(presentation.carriedForwardPendingRows).toHaveLength(0);
  });
});
