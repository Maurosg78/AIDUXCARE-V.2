/**
 * Patient Clinical Memory — persist and query trajectory events for pattern detection.
 * Stores structured events only; no generated text.
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SessionComparisonService } from './sessionComparisonService';
import { encountersRepo } from '../repositories/encountersRepo';
import { classifyTrajectory } from '../core/longitudinal/trajectoryClassifier';
import { extractPainFromSubjective } from '../core/longitudinal/extractPainFromSubjective';
import {
  type PatientTrajectoryEvent,
  type PatientPatternInsight,
  detectPatternFromEvents,
  type TrajectoryLabel,
} from '../core/longitudinal/patientTrajectoryMemory';
import type { TrajectoryConfidence } from '../core/longitudinal/trajectoryClassifier';
import type { EncounterLongitudinalSnapshot } from '../core/longitudinal/encounterLongitudinalSnapshot';
import { getAuth } from 'firebase/auth';

const COLLECTION = 'patient_trajectory_events';
const MIN_EVENTS_FOR_PATTERN = 5;
const MAX_EVENTS_READ = 15;
/** Default temporal window for pattern detection (rehab cycles). Events older than this are ignored. */
const DEFAULT_WITHIN_LAST_DAYS = 90;
const EMPTY_TEXT = '';

function normalizeClinicalText(text: string): string {
  const lowerCasedText = text.toLowerCase();
  const normalizedText = lowerCasedText.normalize('NFD');
  const withoutDiacriticsText = normalizedText.replace(/[\u0300-\u036f]/g, EMPTY_TEXT);
  return withoutDiacriticsText;
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  const hasKeyword = keywords.some((keyword) => text.includes(keyword));
  return hasKeyword;
}

function joinLongitudinalTexts(subjectiveText: string, objectiveText?: string, assessmentText?: string): string {
  const textParts = [subjectiveText, objectiveText, assessmentText];
  const definedTextParts = textParts.filter((textPart): textPart is string => typeof textPart === 'string' && textPart.trim().length > 0);
  const joinedText = definedTextParts.join(' ');
  return joinedText;
}

export function extractRomStatus(text: string): 'improved' | 'stable' | 'decreased' | null {
  const normalizedText = normalizeClinicalText(text);
  const improvedKeywords = [
    'mejoria',
    'mejora',
    'aumento',
    'aumento del rango',
    'incremento',
    'mayor rango',
    'mejor movilidad',
    'improved',
    'improved rom',
    'increased range',
    'better mobility',
    'improved mobility',
    'full range',
    'functional range',
  ];
  const decreasedKeywords = [
    'disminuyo',
    'redujo',
    'limitacion',
    'restriccion',
    'perdio',
    'rango limitado',
    'movilidad limitada',
    'decreased',
    'reduced range',
    'limited mobility',
    'loss of',
    'loss of range',
    'restricted rom',
    'limited rom',
  ];
  const stableKeywords = [
    'sin cambios',
    'estable',
    'igual',
    'mantenido',
    'unchanged',
    'stable',
    'no change',
    'maintained',
  ];
  const hasImprovedSignal = hasAnyKeyword(normalizedText, improvedKeywords);
  if (hasImprovedSignal) {
    return 'improved';
  }
  const hasDecreasedSignal = hasAnyKeyword(normalizedText, decreasedKeywords);
  if (hasDecreasedSignal) {
    return 'decreased';
  }
  const hasStableSignal = hasAnyKeyword(normalizedText, stableKeywords);
  if (hasStableSignal) {
    return 'stable';
  }
  return null;
}

export function extractFunctionStatus(text: string): 'improved' | 'stable' | 'decreased' | null {
  const normalizedText = normalizeClinicalText(text);
  const improvedKeywords = [
    'puede realizar',
    'logra',
    'capaz de',
    'retomo',
    'volvio a',
    'able to',
    'returned to',
    'resumed',
    'functional improvement',
    'improved function',
    'back to work',
    'back to activities',
  ];
  const decreasedKeywords = [
    'dificultad para',
    'incapaz',
    'no puede',
    'limitado para',
    'difficulty with',
    'unable to',
    'cannot',
    'functional limitation',
    'limited in',
    'struggles with',
  ];
  const stableKeywords = [
    'sin cambios funcionales',
    'mantiene actividades',
    'no functional change',
    'maintaining activities',
    'stable function',
    'funcion estable',
  ];
  const hasImprovedSignal = hasAnyKeyword(normalizedText, improvedKeywords);
  if (hasImprovedSignal) {
    return 'improved';
  }
  const hasDecreasedSignal = hasAnyKeyword(normalizedText, decreasedKeywords);
  if (hasDecreasedSignal) {
    return 'decreased';
  }
  const hasStableSignal = hasAnyKeyword(normalizedText, stableKeywords);
  if (hasStableSignal) {
    return 'stable';
  }
  return null;
}

export function extractAdherenceLevel(text: string): 'high' | 'medium' | 'low' | null {
  const normalizedText = normalizeClinicalText(text);
  const highKeywords = [
    '100%',
    'realizo todos',
    'cumplio',
    'completo',
    'adhirio',
    'completed all',
    'full adherence',
    'did all exercises',
    'performed all',
    'completed every exercise',
  ];
  const mediumKeywords = [
    'parcialmente',
    'algunos',
    'la mayoria',
    'occasionally',
    'most of',
    'partial adherence',
    'some exercises',
    'did some',
    'partial compliance',
  ];
  const lowKeywords = [
    'no realizo',
    'no hizo',
    'no cumplio',
    'olvido',
    'did not',
    'non-adherent',
    'forgot',
    'skipped',
    'did not do exercises',
    'poor adherence',
  ];
  const hasHighSignal = hasAnyKeyword(normalizedText, highKeywords);
  if (hasHighSignal) {
    return 'high';
  }
  const hasLowSignal = hasAnyKeyword(normalizedText, lowKeywords);
  if (hasLowSignal) {
    return 'low';
  }
  const hasMediumSignal = hasAnyKeyword(normalizedText, mediumKeywords);
  if (hasMediumSignal) {
    return 'medium';
  }
  return null;
}

function toEvent(doc: any): PatientTrajectoryEvent {
  const raw = doc.createdAt;
  const createdAt =
    typeof raw?.toMillis === 'function' ? new Date(raw.toMillis()) : raw instanceof Date ? raw : new Date(String(raw));
  const rawPainScore = doc.painScore;
  const painScore =
    typeof rawPainScore === 'number' && !Number.isNaN(rawPainScore)
      ? rawPainScore
      : rawPainScore == null
        ? null
        : Number(rawPainScore);
  const normalizedPainScore =
    typeof painScore === 'number' && !Number.isNaN(painScore)
      ? painScore
      : null;
  const rawTrajectory = doc.trajectory;
  const trajectory =
    typeof rawTrajectory === 'string' && rawTrajectory.length > 0
      ? (rawTrajectory as TrajectoryLabel)
      : null;
  const rawTrajectoryConfidence = doc.trajectoryConfidence;
  const trajectoryConfidence =
    typeof rawTrajectoryConfidence === 'string' && rawTrajectoryConfidence.length > 0
      ? (rawTrajectoryConfidence as TrajectoryConfidence)
      : null;
  return {
    patientId: doc.patientId,
    encounterId: doc.encounterId,
    painScore: normalizedPainScore,
    trajectory,
    trajectoryConfidence,
    createdAt: createdAt ? new Date(createdAt) : new Date(),
  };
}

function isPermissionDeniedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const hasPermissionCode = code.includes('permission-denied');
  const hasPermissionMessage = message.includes('permission-denied') || message.includes('Missing or insufficient permissions');
  return hasPermissionCode || hasPermissionMessage;
}

export class PatientTrajectoryMemoryService {
  private comparisonService = new SessionComparisonService();

  private async getRecentEventsFromEncounters(
    patientId: string,
    maxEvents: number,
    options?: { withinLastDays?: number }
  ): Promise<PatientTrajectoryEvent[]> {
    const encounters = await encountersRepo.getEncountersByPatient(patientId, 100);
    const completedEncounters = encounters.filter((encounter) => encounter.status === 'completed' || encounter.status === 'signed');
    const encountersWithSnapshot = completedEncounters.filter((encounter) => {
      const painScore = encounter.longitudinalSnapshot?.painScore;
      const trajectory = encounter.longitudinalSnapshot?.trajectory;
      const confidence = encounter.longitudinalSnapshot?.trajectoryConfidence;
      const hasPainScore = typeof painScore === 'number' && !Number.isNaN(painScore);
      const hasTrajectory = typeof trajectory === 'string' && trajectory.length > 0;
      const hasConfidence = typeof confidence === 'string' && confidence.length > 0;
      return hasPainScore && hasTrajectory && hasConfidence;
    });
    const withinLastDays = options?.withinLastDays;
    const cutoffMs = withinLastDays != null && withinLastDays > 0
      ? Date.now() - withinLastDays * 24 * 60 * 60 * 1000
      : null;
    const recentEncounters = encountersWithSnapshot.filter((encounter) => {
      if (cutoffMs == null) {
        return true;
      }
      const encounterDateMs = encounter.encounterDate.toMillis();
      return encounterDateMs >= cutoffMs;
    });
    const byDateAsc = [...recentEncounters].sort((left, right) => left.encounterDate.toMillis() - right.encounterDate.toMillis());
    const lastEncounters = byDateAsc.slice(-maxEvents);
    const events = lastEncounters.map((encounter) => {
      const snapshot = encounter.longitudinalSnapshot!;
      const event: PatientTrajectoryEvent = {
        patientId,
        encounterId: encounter.id,
        painScore: snapshot.painScore!,
        trajectory: snapshot.trajectory as TrajectoryLabel,
        trajectoryConfidence: snapshot.trajectoryConfidence as TrajectoryConfidence,
        createdAt: new Date(encounter.encounterDate.toMillis()),
      };
      return event;
    });
    return events;
  }

  async buildEncounterLongitudinalSnapshot(
    patientId: string,
    subjectiveText: string,
    options?: { hepAdherenceRate?: number; objectiveText?: string; assessmentText?: string }
  ): Promise<EncounterLongitudinalSnapshot> {
    const extractedPainScore = extractPainFromSubjective(subjectiveText);
    const painScore = extractedPainScore ?? null;
    const rawHepAdherenceRate = options?.hepAdherenceRate;
    const hepAdherenceRate = typeof rawHepAdherenceRate === 'number' ? rawHepAdherenceRate : null;
    const objectiveText = options?.objectiveText;
    const assessmentText = options?.assessmentText;
    const combinedLongitudinalText = joinLongitudinalTexts(subjectiveText, objectiveText, assessmentText);
    const romStatus = extractRomStatus(combinedLongitudinalText);
    const functionStatus = extractFunctionStatus(combinedLongitudinalText);
    const adherenceLevel = extractAdherenceLevel(combinedLongitudinalText);
    const hasPainScore = painScore !== null;
    const previousSeries = hasPainScore ? await this.comparisonService.getLastNPainSeries(patientId, 3) : [];
    const fullSeries = hasPainScore ? [...previousSeries, painScore] : previousSeries;
    const hasEnoughSeries = fullSeries.length >= 2;
    const classification = hasEnoughSeries ? classifyTrajectory(fullSeries) : null;
    const trajectory =
      classification != null
        ? ((classification.label === 'stable' ? 'plateau' : classification.label) as TrajectoryLabel)
        : null;
    const trajectoryConfidence = classification?.confidence ?? null;
    const snapshot: EncounterLongitudinalSnapshot = {
      painScore,
      hepAdherenceRate,
      trajectory,
      trajectoryConfidence,
      romStatus,
      functionStatus,
      adherenceLevel,
      keyLimitations: undefined,
      alerts: undefined,
    };
    return snapshot;
  }

  /**
   * Record this encounter's trajectory (pain + classification) after finalize.
   * Uses previous encounters' pain to classify; does not require SOAP to be on encounter yet.
   */
  async recordEncounterTrajectory(
    patientId: string,
    encounterId: string,
    subjectiveText: string
  ): Promise<void> {
    const snapshot = await this.buildEncounterLongitudinalSnapshot(patientId, subjectiveText);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    if (!userId) return;

    await addDoc(collection(db, COLLECTION), {
      userId,
      patientId,
      encounterId,
      painScore: snapshot.painScore,
      trajectory: snapshot.trajectory,
      trajectoryConfidence: snapshot.trajectoryConfidence,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Get trajectory events for the patient (oldest first).
   * @param withinLastDays - If set, only events within this many days (e.g. 90 for same rehab cycle).
   */
  async getRecentEvents(
    patientId: string,
    maxEvents = MAX_EVENTS_READ,
    options?: { withinLastDays?: number }
  ): Promise<PatientTrajectoryEvent[]> {
    try {
      const withinLastDays = options?.withinLastDays;
      const constraints: ReturnType<typeof where>[] = [where('patientId', '==', patientId)];

      if (withinLastDays != null && withinLastDays > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - withinLastDays);
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(cutoff)));
      }

      const q = query(
        collection(db, COLLECTION),
        ...constraints,
        orderBy('createdAt', 'asc'),
        limit(maxEvents)
      );
      const snap = await getDocs(q);
      const docs = Array.isArray((snap as { docs?: unknown[] } | null)?.docs)
        ? (snap as { docs: Array<{ id: string; data: () => unknown }> }).docs
        : [];
      if (docs.length === 0) {
        return [];
      }
      const events = docs.map((d) => {
        const rawEvent = d.data();
        const eventData =
          rawEvent != null && typeof rawEvent === 'object'
            ? (rawEvent as Record<string, unknown>)
            : {};
        const event = toEvent({ ...eventData, id: d.id });
        return event;
      });
      return events;
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        throw error;
      }
      const fallbackEvents = await this.getRecentEventsFromEncounters(patientId, maxEvents, options);
      return fallbackEvents;
    }
  }

  /**
   * Get pattern insight for UI (observation only). Returns null if no pattern or too few events.
   * Uses events within last 90 days by default so patterns reflect the current rehab cycle.
   */
  async getPatternInsight(patientId: string): Promise<PatientPatternInsight | null> {
    const events = await this.getRecentEvents(patientId, MAX_EVENTS_READ, {
      withinLastDays: DEFAULT_WITHIN_LAST_DAYS,
    });
    return detectPatternFromEvents(events, MIN_EVENTS_FOR_PATTERN);
  }
}
