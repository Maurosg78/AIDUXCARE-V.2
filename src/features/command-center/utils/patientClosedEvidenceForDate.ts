import { encountersRepo } from '../../../repositories/encountersRepo';
import { PersistenceService, type SavedNote } from '../../../services/PersistenceService';

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function noteHasFinalizedSoap(note: SavedNote): boolean {
  const noteRecord = note as SavedNote & { soapStatus?: string };
  const noteStatus = note.status;
  const soapStatus = noteRecord.soapStatus;
  const hasFinalizedStatus = noteStatus === 'finalized';
  const hasFinalizedSoapStatus = soapStatus === 'finalized';

  return hasFinalizedStatus || hasFinalizedSoapStatus;
}

/**
 * Determina si un paciente tiene evidencia clínica cerrada
 * para una fecha específica. Fuente de verdad: encounters
 * y notes finalizadas. NO usa quickItem.status (legacy).
 *
 * Esta función existe porque la migración de pendientes
 * entre días no debe basarse en estado de UI sino en estado
 * clínico real persistido.
 */
export async function patientHasClosedClinicalEvidenceForDate(
  patientId: string,
  dateKey: string
): Promise<boolean> {
  if (patientId.trim() === '' || !isValidDateKey(dateKey)) {
    return false;
  }

  try {
    const encounters = await encountersRepo.getEncountersByPatient(patientId, 50);
    const hasClosedEncounterForDate = encounters.some((encounter) => {
      const encounterStatus = encounter.status;
      const isClosedEncounter =
        encounterStatus === 'completed' ||
        encounterStatus === 'signed';
      if (!isClosedEncounter) {
        return false;
      }

      const encounterDate = encounter.encounterDate.toDate();
      const encounterDateKey = toLocalDateKey(encounterDate);

      return encounterDateKey === dateKey;
    });

    if (hasClosedEncounterForDate) {
      return true;
    }

    const notes = await PersistenceService.getNotesByPatient(patientId);
    const hasFinalizedNoteForDate = notes.some((note) => {
      const noteClinicalDate = note.clinicalDate;
      if (noteClinicalDate !== dateKey) {
        return false;
      }

      return noteHasFinalizedSoap(note);
    });

    return hasFinalizedNoteForDate;
  } catch {
    return false;
  }
}
