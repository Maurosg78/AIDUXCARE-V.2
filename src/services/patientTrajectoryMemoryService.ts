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

function toEvent(doc: any): PatientTrajectoryEvent {
  const raw = doc.createdAt;
  const createdAt =
    typeof raw?.toMillis === 'function' ? new Date(raw.toMillis()) : raw instanceof Date ? raw : new Date(String(raw));
  return {
    patientId: doc.patientId,
    encounterId: doc.encounterId,
    painScore: Number(doc.painScore),
    trajectory: doc.trajectory as TrajectoryLabel,
    trajectoryConfidence: doc.trajectoryConfidence as TrajectoryConfidence,
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
    options?: { hepAdherenceRate?: number }
  ): Promise<EncounterLongitudinalSnapshot | null> {
    const painScore = extractPainFromSubjective(subjectiveText);
    const hepAdherenceRate = options?.hepAdherenceRate;
    const hasPainScore = painScore !== null;
    const hasHepAdherenceRate = typeof hepAdherenceRate === 'number';
    if (!hasPainScore && !hasHepAdherenceRate) return null;
    if (!hasPainScore) {
      return { hepAdherenceRate };
    }

    const previousSeries = await this.comparisonService.getLastNPainSeries(patientId, 3);
    const fullSeries = [...previousSeries, painScore];
    if (fullSeries.length < 2) {
      return { painScore, hepAdherenceRate };
    }

    const classification = classifyTrajectory(fullSeries);
    const trajectory = (classification.label === 'stable' ? 'plateau' : classification.label) as TrajectoryLabel;

    return {
      painScore,
      hepAdherenceRate,
      trajectory,
      trajectoryConfidence: classification.confidence,
    };
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
    if (snapshot?.painScore == null || !snapshot.trajectory || !snapshot.trajectoryConfidence) return;
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
