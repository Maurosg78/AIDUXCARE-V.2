import { encountersRepo } from '../../../repositories/encountersRepo';
import { PersistenceService, type SavedNote } from '../../../services/PersistenceService';
import type { PatientListItem } from '../hooks/usePatientsList';
import type { Appointment } from '../hooks/useAppointmentSchedule';
import type { InProgressSession } from '../hooks/useInProgressSessions';
import type { TodayQuickItem } from '../components/TodayPatientsPanel';

export type ClinicalDayStatus =
  | 'programado'
  | 'iniciado'
  | 'incompleto'
  | 'draft-only'
  | 'documentado'
  | 'cancelado';

export type ClinicalDayStatusInput = {
  hasAppointment: boolean;
  appointmentStatus?: 'scheduled' | 'cancelled';
  hasSession: boolean;
  sessionStatus?: string;
  hasEncounter: boolean;
  hasConsultation: boolean;
  soapStatus?: 'draft' | 'finalized' | null;
};

export type ClinicalDayRow = {
  patientId: string;
  patientName: string;
  time?: string;
  status: ClinicalDayStatus;
  hasEncounter: boolean;
  hasSession: boolean;
  hasConsultation: boolean;
  resumeSessionId?: string;
  consultationId?: string;
  sessionType?: 'initial' | 'followup' | 'ongoing';
};

type BuildClinicalDayViewOptions = {
  appointments: Appointment[];
  sessions: InProgressSession[];
  quickItems: TodayQuickItem[];
};

/**
 * Doctrine for B7:
 * - Encounter is the only source that can make a row clinically "documentado".
 * - Consultation without encounter is supporting document state only.
 * - Consultation without encounter can become "draft-only", never "documentado".
 * - Administrative cancellation must not hide clinical activity already recorded that day.
 */

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDateKeyFromIsoString(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  const isValidDate = !Number.isNaN(parsedDate.getTime());
  if (!isValidDate) {
    return null;
  }

  return toLocalDateKey(parsedDate);
}

function normalizeSessionStatus(status?: string): string | undefined {
  if (!status) {
    return undefined;
  }

  if (status === 'recording_in_progress') {
    return 'in_progress';
  }

  return status;
}

function normalizeAppointmentStatus(status?: Appointment['status']): 'scheduled' | 'cancelled' | undefined {
  if (status === 'cancelled') {
    return 'cancelled';
  }

  if (status) {
    return 'scheduled';
  }

  return undefined;
}

function getRowTime(appointment?: Appointment): string | undefined {
  if (!appointment?.dateTime) {
    return undefined;
  }

  return new Date(appointment.dateTime).toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pickBestConsultation(
  notes: SavedNote[],
  dateKey: string,
  encounterSessionId?: string
): SavedNote | null {
  const dateMatchedNotes = notes.filter((note) => {
    const matchesClinicalDate = note.clinicalDate === dateKey;
    const matchesCreatedDate = toDateKeyFromIsoString(note.createdAt) === dateKey;

    return matchesClinicalDate || matchesCreatedDate;
  });

  const matchingEncounterNotes = encounterSessionId
    ? dateMatchedNotes.filter((note) => note.sessionId === encounterSessionId)
    : [];

  const candidateNotes = matchingEncounterNotes.length > 0
    ? matchingEncounterNotes
    : dateMatchedNotes;

  if (candidateNotes.length === 0) {
    return null;
  }

  const sortedNotes = [...candidateNotes].sort((leftNote, rightNote) => {
    const leftStatus = leftNote.status ?? 'finalized';
    const rightStatus = rightNote.status ?? 'finalized';
    if (leftStatus !== rightStatus) {
      return leftStatus === 'finalized' ? -1 : 1;
    }

    return new Date(rightNote.updatedAt || rightNote.createdAt).getTime() - new Date(leftNote.updatedAt || leftNote.createdAt).getTime();
  });

  return sortedNotes[0] ?? null;
}

export function resolveClinicalDayStatus(input: ClinicalDayStatusInput): ClinicalDayStatus {
  const hasClinicalActivity =
    input.hasEncounter ||
    input.hasConsultation ||
    input.hasSession;

  // Clinical truth wins first. "documentado" requires encounter + finalized backing note.
  if (input.hasEncounter && input.soapStatus === 'finalized') {
    return 'documentado';
  }

  // Encounter without finalized note remains clinically incomplete at documentation level.
  if (input.hasEncounter && input.soapStatus !== 'finalized') {
    return 'draft-only';
  }

  // Consultation without encounter is visible as document backing only; it must NOT be promoted to "documentado".
  // Any non-finalized backing note remains "draft-only" even if future note states are added.
  if (input.hasConsultation && !input.hasEncounter && input.soapStatus !== 'finalized') {
    return 'draft-only';
  }

  // Cancellation only wins when there was no clinical activity that day.
  if (input.appointmentStatus === 'cancelled' && !hasClinicalActivity) {
    return 'cancelado';
  }

  if (input.hasSession && input.sessionStatus === 'in_progress') {
    return 'iniciado';
  }

  if (input.hasSession && !input.hasEncounter) {
    return 'incompleto';
  }

  if (input.hasAppointment && !input.hasSession) {
    return 'programado';
  }

  return 'programado';
}

/**
 * Local v1 clinical-day aggregator.
 *
 * This is intentionally a Command Center-local fan-out by patient using existing repos/services.
 * It is NOT the final architecture and should not be confused with a scalable day-history read model.
 * Risk: per-patient fan-out can get expensive as patient/day volume grows.
 * Scope here is pilot-safe reuse of existing reads without backend/index changes.
 */
export async function buildClinicalDayView(
  date: Date,
  patientList: PatientListItem[],
  options: BuildClinicalDayViewOptions
): Promise<ClinicalDayRow[]> {
  const dateKey = toLocalDateKey(date);
  const appointmentByPatientId = new Map<string, Appointment>();
  const sessionByPatientId = new Map<string, InProgressSession>();
  const quickItemByPatientId = new Map<string, TodayQuickItem>();

  for (const appointment of options.appointments) {
    appointmentByPatientId.set(appointment.patientId, appointment);
  }

  for (const session of options.sessions) {
    if (session.dateKey === dateKey) {
      sessionByPatientId.set(session.patientId, session);
    }
  }

  for (const quickItem of options.quickItems) {
    quickItemByPatientId.set(quickItem.patientId, quickItem);
  }

  const patientById = new Map<string, PatientListItem>();
  for (const patient of patientList) {
    patientById.set(patient.id, patient);
  }

  for (const appointment of options.appointments) {
    if (!patientById.has(appointment.patientId)) {
      patientById.set(appointment.patientId, {
        id: appointment.patientId,
        firstName: '',
        lastName: '',
        fullName: appointment.patientName || 'Patient',
      });
    }
  }

  for (const session of options.sessions) {
    if (!patientById.has(session.patientId)) {
      patientById.set(session.patientId, {
        id: session.patientId,
        firstName: '',
        lastName: '',
        fullName: session.patientName || 'Patient',
      });
    }
  }

  for (const quickItem of options.quickItems) {
    if (!patientById.has(quickItem.patientId)) {
      patientById.set(quickItem.patientId, {
        id: quickItem.patientId,
        firstName: '',
        lastName: '',
        fullName: quickItem.patientName || 'Patient',
      });
    }
  }

  const candidatePatients = Array.from(patientById.values());

  const rows = await Promise.all(
    candidatePatients.map(async (patient) => {
      const appointment = appointmentByPatientId.get(patient.id);
      const session = sessionByPatientId.get(patient.id);
      const quickItem = quickItemByPatientId.get(patient.id);

      const encounters = await encountersRepo.getEncountersByPatient(patient.id, 50);
      const encountersForDate = encounters.filter((encounter) => {
        const rawEncounterDate = encounter.encounterDate;
        const encounterDate = rawEncounterDate?.toDate?.() ?? rawEncounterDate;
        if (!(encounterDate instanceof Date) || Number.isNaN(encounterDate.getTime())) {
          return false;
        }

        return toLocalDateKey(encounterDate) === dateKey;
      });
      const encounter = encountersForDate[0] ?? null;

      const notes = await PersistenceService.getNotesByPatient(patient.id);
      const consultation = pickBestConsultation(notes, dateKey, encounter?.sessionId);

      const hasAppointment = Boolean(appointment || quickItem);
      const hasSession = Boolean(session);
      const hasEncounter = Boolean(encounter);
      const hasConsultation = Boolean(consultation);
      const appointmentStatus = normalizeAppointmentStatus(appointment?.status);
      const sessionStatus = normalizeSessionStatus(session?.status);
      const soapStatus = consultation ? (consultation.status ?? 'finalized') : null;
      const status = resolveClinicalDayStatus({
        hasAppointment,
        appointmentStatus,
        hasSession,
        sessionStatus,
        hasEncounter,
        hasConsultation,
        soapStatus,
      });
      const hasAnySource =
        hasAppointment ||
        hasSession ||
        hasEncounter ||
        hasConsultation;

      if (!hasAnySource) {
        return null;
      }

      const row: ClinicalDayRow = {
        patientId: patient.id,
        patientName: patient.fullName || [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Patient',
        time: getRowTime(appointment),
        status,
        hasEncounter,
        hasSession,
        hasConsultation,
        resumeSessionId: session?.id ?? quickItem?.resumeSessionId,
        consultationId: consultation?.id,
        sessionType: (quickItem?.sessionType ?? session?.sessionType ?? undefined) as ClinicalDayRow['sessionType'],
      };

      return row;
    })
  );

  const filteredRows = rows.filter((row): row is ClinicalDayRow => row != null);
  const sortedRows = filteredRows.sort((leftRow, rightRow) => {
    const leftTime = leftRow.time ?? '99:99';
    const rightTime = rightRow.time ?? '99:99';
    if (leftTime !== rightTime) {
      return leftTime.localeCompare(rightTime);
    }

    return leftRow.patientName.localeCompare(rightRow.patientName, 'en', { sensitivity: 'base' });
  });

  return sortedRows;
}
