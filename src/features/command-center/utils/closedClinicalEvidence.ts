import type { SavedNote } from '../../../services/PersistenceService';

export function isClosedEncounterStatus(status?: string): boolean {
  return status === 'completed' || status === 'signed';
}

export function noteHasFinalizedSoap(note: SavedNote): boolean {
  const noteRecord = note as SavedNote & { soapStatus?: string };
  const noteStatus = note.status;
  const soapStatus = noteRecord.soapStatus;
  const hasFinalizedStatus = noteStatus === 'finalized';
  const hasFinalizedSoapStatus = soapStatus === 'finalized';

  return hasFinalizedStatus || hasFinalizedSoapStatus;
}
