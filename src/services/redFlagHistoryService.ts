import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

import type {
  RedFlagHistoryEntry,
  RedFlagHistoryResolution,
  RedFlagHistoryVisitType,
  UpsertRedFlagHistoryInput,
} from '@/types/redFlagHistory';

const PATIENTS_COLLECTION = 'patients';
const RED_FLAG_HISTORY_SUBCOLLECTION = 'redFlagHistory';

function normalizeRedFlagText(flagText: string): string {
  const trimmedText = flagText.trim();
  const lowerCasedText = trimmedText.toLowerCase();
  const normalizedText = lowerCasedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalizedText;
}

export function buildRedFlagHistoryId(flagText: string): string {
  const normalizedText = normalizeRedFlagText(flagText);
  const slugText = normalizedText.replace(/[^a-z0-9]+/g, '-');
  const collapsedText = slugText.replace(/^-+|-+$/g, '');
  const fallbackId = 'red-flag';
  const resolvedId = collapsedText || fallbackId;
  return resolvedId;
}

function getRedFlagHistoryCollectionRef(patientId: string) {
  const collectionRef = collection(
    db,
    PATIENTS_COLLECTION,
    patientId,
    RED_FLAG_HISTORY_SUBCOLLECTION,
  );
  return collectionRef;
}

function getRedFlagHistoryDocRef(patientId: string, flagId: string) {
  const docRef = doc(
    db,
    PATIENTS_COLLECTION,
    patientId,
    RED_FLAG_HISTORY_SUBCOLLECTION,
    flagId,
  );
  return docRef;
}

function mapRedFlagHistoryEntry(
  id: string,
  rawData: Record<string, unknown>,
): RedFlagHistoryEntry {
  const mappedEntry: RedFlagHistoryEntry = {
    id,
    flagText: String(rawData.flagText ?? ''),
    firstDetected: rawData.firstDetected as RedFlagHistoryEntry['firstDetected'],
    lastReviewed: rawData.lastReviewed as RedFlagHistoryEntry['lastReviewed'],
    reviewedBy: String(rawData.reviewedBy ?? ''),
    decision: rawData.decision as RedFlagHistoryEntry['decision'],
    sessionId: String(rawData.sessionId ?? ''),
    status: rawData.status as RedFlagHistoryEntry['status'],
    visitType: (rawData.visitType as RedFlagHistoryVisitType | undefined) ?? 'unknown',
    updatedAt: rawData.updatedAt as RedFlagHistoryEntry['updatedAt'],
    createdAt: rawData.createdAt as RedFlagHistoryEntry['createdAt'],
  };
  return mappedEntry;
}

export async function getRedFlagHistoryEntry(
  patientId: string,
  flagTextOrId: string,
): Promise<RedFlagHistoryEntry | null> {
  const flagId = buildRedFlagHistoryId(flagTextOrId);
  const docRef = getRedFlagHistoryDocRef(patientId, flagId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const rawData = snapshot.data() as Record<string, unknown>;
  const mappedEntry = mapRedFlagHistoryEntry(snapshot.id, rawData);
  return mappedEntry;
}

export async function listRedFlagHistory(
  patientId: string,
): Promise<RedFlagHistoryEntry[]> {
  const collectionRef = getRedFlagHistoryCollectionRef(patientId);
  const orderedQuery = query(collectionRef, orderBy('lastReviewed', 'desc'));
  const snapshot = await getDocs(orderedQuery);

  const entries = snapshot.docs.map((entryDoc) => {
    const rawData = entryDoc.data() as Record<string, unknown>;
    const mappedEntry = mapRedFlagHistoryEntry(entryDoc.id, rawData);
    return mappedEntry;
  });

  return entries;
}

export async function upsertRedFlagHistoryEntry(
  input: UpsertRedFlagHistoryInput,
): Promise<RedFlagHistoryEntry> {
  const detectedAt = input.detectedAt ?? new Date();
  const visitType = input.visitType ?? 'unknown';
  const flagId = buildRedFlagHistoryId(input.flagText);
  const existingEntry = await getRedFlagHistoryEntry(input.patientId, flagId);
  const firstDetected = existingEntry?.firstDetected ?? detectedAt;
  const docRef = getRedFlagHistoryDocRef(input.patientId, flagId);

  const payload = {
    flagText: input.flagText.trim(),
    firstDetected,
    lastReviewed: detectedAt,
    reviewedBy: input.reviewedBy,
    decision: input.decision,
    sessionId: input.sessionId,
    status: input.status,
    visitType,
    updatedAt: serverTimestamp(),
    createdAt: existingEntry?.createdAt ?? serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });

  const persistedEntry: RedFlagHistoryEntry = {
    id: flagId,
    flagText: payload.flagText,
    firstDetected,
    lastReviewed: detectedAt,
    reviewedBy: input.reviewedBy,
    decision: input.decision,
    sessionId: input.sessionId,
    status: input.status,
    visitType,
    updatedAt: detectedAt,
    createdAt: existingEntry?.createdAt ?? detectedAt,
  };

  return persistedEntry;
}

export async function resolveRedFlagsAgainstHistory(
  patientId: string,
  incomingRedFlags: string[],
): Promise<RedFlagHistoryResolution[]> {
  const historyEntries = await listRedFlagHistory(patientId);
  const historyById = new Map(
    historyEntries.map((entry) => {
      const entryTuple = [entry.id, entry] as const;
      return entryTuple;
    }),
  );

  const resolutions = incomingRedFlags.map((incomingFlagText) => {
    const historyId = buildRedFlagHistoryId(incomingFlagText);
    const matchedEntry = historyById.get(historyId) ?? null;

    if (!matchedEntry) {
      return {
        incomingFlagText,
        historyId,
        matchedEntry: null,
        status: 'new_pending',
      } satisfies RedFlagHistoryResolution;
    }

    if (matchedEntry.status === 'pending') {
      return {
        incomingFlagText,
        historyId,
        matchedEntry,
        status: 'known_pending',
      } satisfies RedFlagHistoryResolution;
    }

    return {
      incomingFlagText,
      historyId,
      matchedEntry,
      status: 'known_reviewed',
    } satisfies RedFlagHistoryResolution;
  });

  return resolutions;
}
