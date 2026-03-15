/**
 * Patient Clinical Memory — persist and query trajectory events for pattern detection.
 * Stores structured events only; no generated text.
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SessionComparisonService } from './sessionComparisonService';
import { classifyTrajectory } from '../core/longitudinal/trajectoryClassifier';
import { extractPainFromSubjective } from '../core/longitudinal/extractPainFromSubjective';
import {
  type PatientTrajectoryEvent,
  type PatientPatternInsight,
  detectPatternFromEvents,
  type TrajectoryLabel,
} from '../core/longitudinal/patientTrajectoryMemory';
import type { TrajectoryConfidence } from '../core/longitudinal/trajectoryClassifier';

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

export class PatientTrajectoryMemoryService {
  private comparisonService = new SessionComparisonService();

  /**
   * Record this encounter's trajectory (pain + classification) after finalize.
   * Uses previous encounters' pain to classify; does not require SOAP to be on encounter yet.
   */
  async recordEncounterTrajectory(
    patientId: string,
    encounterId: string,
    subjectiveText: string
  ): Promise<void> {
    const painScore = extractPainFromSubjective(subjectiveText);
    if (painScore === null) return;

    // Use last 3 *previous* sessions (current not yet in encounters or we'd double-count)
    const previousSeries = await this.comparisonService.getLastNPainSeries(patientId, 3);
    const fullSeries = [...previousSeries, painScore];
    if (fullSeries.length < 2) return;

    const classification = classifyTrajectory(fullSeries);
    const trajectory = (classification.label === 'stable' ? 'plateau' : classification.label) as TrajectoryLabel;

    await addDoc(collection(db, COLLECTION), {
      patientId,
      encounterId,
      painScore,
      trajectory,
      trajectoryConfidence: classification.confidence,
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
    const events = snap.docs.map((d) => toEvent({ ...d.data(), id: d.id }));
    return events;
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
