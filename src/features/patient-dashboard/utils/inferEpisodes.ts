/**
 * PHASE 1A: Episode Inference Algorithm
 *
 * CTO Decisions:
 * 1. Deduplicate by sessionId (consultation > encounter > session)
 * 2. Orphaned follow-ups go to separate array
 * 3. 'consultation' type normalized to 'follow-up'
 */

import type { PatientVisit } from '../hooks/usePatientVisits';

export interface EpisodeVisit extends PatientVisit {
  episodeNumber: number;
  visitNumber: number;
  displayNumber: string;
}

export interface Episode {
  episodeNumber: number;
  initialVisit: EpisodeVisit;
  followUps: EpisodeVisit[];
  status: 'active' | 'closed';
  startDate: Date;
  lastVisitDate: Date;
}

export interface EpisodesResult {
  episodes: Episode[];
  orphanedFollowUps: EpisodeVisit[]; // Follow-ups without initial
}

/**
 * Deduplicate visits by sessionId
 * Priority: consultation > encounter > session
 */
function deduplicateVisits(visits: PatientVisit[]): PatientVisit[] {
  const byKey = new Map<string, PatientVisit>();
  const priority: Record<string, number> = { consultation: 3, encounter: 2, session: 1 };

  for (const visit of visits) {
    // Key: sessionId if exists, otherwise unique id
    const key = visit.sessionIdForResume || visit.id;
    const existing = byKey.get(key);
    const visitPriority = priority[visit.source] ?? 0;
    const existingPriority = existing ? (priority[existing.source] ?? 0) : 0;

    if (!existing || visitPriority > existingPriority) {
      byKey.set(key, visit);
    }
  }

  return Array.from(byKey.values());
}

/**
 * Normalize visit types ('consultation' → 'follow-up')
 */
function normalizeVisitType(visit: PatientVisit): PatientVisit {
  if (visit.type === 'consultation') {
    return { ...visit, type: 'follow-up' };
  }
  return visit;
}

/**
 * Infer episodes from flat list of visits
 */
export function inferEpisodes(visits: PatientVisit[]): EpisodesResult {
  if (!visits || visits.length === 0) {
    return { episodes: [], orphanedFollowUps: [] };
  }

  // Step 1: Deduplicate
  const deduplicated = deduplicateVisits(visits);

  // Step 2: Normalize types
  const normalized = deduplicated.map(normalizeVisitType);

  // Step 3: Sort by date ascending (oldest first)
  const sorted = [...normalized].sort((a, b) => a.date.getTime() - b.date.getTime());

  const episodes: Episode[] = [];
  const orphanedFollowUps: EpisodeVisit[] = [];
  let currentEpisode: Episode | null = null;
  let episodeNumber = 0;

  for (const visit of sorted) {
    if (visit.type === 'initial') {
      // Close previous episode
      if (currentEpisode) {
        episodes.push(currentEpisode);
      }

      // Start new episode
      episodeNumber++;
      const episodeVisit: EpisodeVisit = {
        ...visit,
        episodeNumber,
        visitNumber: 0,
        displayNumber: `${episodeNumber}`,
      };

      currentEpisode = {
        episodeNumber,
        initialVisit: episodeVisit,
        followUps: [],
        status: 'active',
        startDate: visit.date,
        lastVisitDate: visit.date,
      };
    } else if (visit.type === 'follow-up') {
      if (!currentEpisode) {
        // Orphaned follow-up → separate array
        orphanedFollowUps.push({
          ...visit,
          episodeNumber: 0,
          visitNumber: orphanedFollowUps.length + 1,
          displayNumber: `P${orphanedFollowUps.length + 1}`, // P = Previous
        });
      } else {
        // Add to current episode
        const visitNumber = currentEpisode.followUps.length + 1;
        const episodeVisit: EpisodeVisit = {
          ...visit,
          episodeNumber: currentEpisode.episodeNumber,
          visitNumber,
          displayNumber: `${currentEpisode.episodeNumber}.${visitNumber}`,
        };

        currentEpisode.followUps.push(episodeVisit);
        currentEpisode.lastVisitDate = visit.date;
      }
    }
  }

  // Add last episode
  if (currentEpisode) {
    episodes.push(currentEpisode);
  }

  // Determine status (most recent = active)
  if (episodes.length > 0) {
    episodes.forEach((ep, idx) => {
      ep.status = idx === episodes.length - 1 ? 'active' : 'closed';
    });
  }

  return { episodes, orphanedFollowUps };
}

/**
 * Get all visits in display order (newest first)
 */
export function getVisitsFromEpisodes(result: EpisodesResult): EpisodeVisit[] {
  const allVisits: EpisodeVisit[] = [];

  // Episodes (newest first)
  const reversed = [...result.episodes].reverse();
  for (const episode of reversed) {
    allVisits.push(episode.initialVisit);
    allVisits.push(...[...episode.followUps].reverse());
  }

  // Orphaned at the end (oldest documentation)
  allVisits.push(...[...result.orphanedFollowUps].reverse());

  return allVisits;
}
