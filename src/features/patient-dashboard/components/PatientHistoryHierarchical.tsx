/**
 * PHASE 1A: Hierarchical Patient History Component
 *
 * Displays visits grouped by episodes with collapsible accordions.
 * - Each initial starts an episode
 * - Follow-ups nested under their episode
 * - Active episode marked with ⏺, closed with ✓
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Episode, EpisodeVisit } from '../utils/inferEpisodes';

interface Props {
  episodes: Episode[];
  orphanedFollowUps: EpisodeVisit[];
  patientId: string;
}

export const PatientHistoryHierarchical: React.FC<Props> = ({
  episodes,
  orphanedFollowUps,
  patientId,
}) => {
  const navigate = useNavigate();
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(
    new Set(episodes.length > 0 ? [episodes[episodes.length - 1].episodeNumber] : [])
  );
  const [showOrphaned, setShowOrphaned] = useState(false);

  const toggleEpisode = (episodeNumber: number) => {
    const next = new Set(expandedEpisodes);
    if (next.has(episodeNumber)) {
      next.delete(episodeNumber);
    } else {
      next.add(episodeNumber);
    }
    setExpandedEpisodes(next);
  };

  const handleVisitClick = (visit: EpisodeVisit) => {
    const isResumableInitial =
      visit.type === 'initial' &&
      visit.soapNote?.status !== 'finalized' &&
      (visit.source === 'session' || visit.source === 'encounter');

    const isPendingFollowUp =
      visit.type === 'follow-up' && visit.soapNote?.status !== 'finalized';

    if (isResumableInitial) {
      navigate(
        `/workflow?type=initial&patientId=${patientId}&sessionId=${visit.sessionIdForResume || visit.id}&resume=true`
      );
    } else if (isPendingFollowUp) {
      navigate(`/workflow?type=followup&patientId=${patientId}`);
    } else if (visit.source === 'consultation') {
      navigate(`/notes/${visit.id}`);
    } else {
      console.log('View SOAP:', visit.id);
    }
  };

  const renderVisitRow = (visit: EpisodeVisit, isInitial = false) => {
    const isFinalized = visit.soapNote?.status === 'finalized';
    const statusColor = isFinalized ? 'text-green-600' : 'text-yellow-600';
    const statusSymbol = isFinalized ? '✓' : '⟳';

    return (
      <div
        key={visit.id}
        onClick={() => handleVisitClick(visit)}
        className={`
          flex items-center justify-between p-3 rounded-lg border cursor-pointer
          transition-all hover:bg-slate-50 hover:border-slate-300
          ${isInitial ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}
        `}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 min-w-[60px]">
            <span className={`text-sm font-semibold ${statusColor}`}>
              {statusSymbol}
            </span>
            <span className="text-xs font-mono text-slate-600">
              {visit.displayNumber}
            </span>
          </div>

          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">
              {isInitial ? 'Initial Assessment' : 'Follow-up'}
            </div>
            {visit.chiefComplaint && (
              <div className="text-xs text-slate-600 mt-1 line-clamp-1">
                {visit.chiefComplaint}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500">
            {visit.date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year:
                visit.date.getFullYear() !== new Date().getFullYear()
                  ? 'numeric'
                  : undefined,
            })}
          </div>
        </div>

        <FileText className="w-4 h-4 text-slate-400" />
      </div>
    );
  };

  const renderEpisode = (episode: Episode) => {
    const isExpanded = expandedEpisodes.has(episode.episodeNumber);
    const statusSymbol = episode.status === 'active' ? '⏺' : '✓';
    const statusColor =
      episode.status === 'active' ? 'text-blue-600' : 'text-green-600';

    return (
      <div
        key={episode.episodeNumber}
        className="border border-slate-200 rounded-lg overflow-hidden"
      >
        {/* Episode Header */}
        <div
          onClick={() => toggleEpisode(episode.episodeNumber)}
          className="
            flex items-center justify-between p-4 bg-slate-50 cursor-pointer
            hover:bg-slate-100 transition-colors
          "
        >
          <div className="flex items-center gap-3 flex-1">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-600" />
            )}

            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${statusColor}`}>
                {statusSymbol}
              </span>
              <span className="text-sm font-mono text-slate-600">
                Episode {episode.episodeNumber}
              </span>
            </div>

            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">
                {episode.initialVisit.chiefComplaint || 'Initial Assessment'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {episode.followUps.length} follow-up
                {episode.followUps.length !== 1 ? 's' : ''} · Started{' '}
                {episode.startDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>

            <div
              className={`
              px-2 py-1 rounded text-xs font-medium
              ${
                episode.status === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }
            `}
            >
              {episode.status === 'active' ? 'Active' : 'Closed'}
            </div>
          </div>
        </div>

        {/* Episode Visits */}
        {isExpanded && (
          <div className="p-4 space-y-2">
            {/* Initial */}
            {renderVisitRow(episode.initialVisit, true)}

            {/* Follow-ups */}
            {episode.followUps.map((visit) => renderVisitRow(visit))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Episodes (newest first) */}
      {[...episodes].reverse().map((episode) => renderEpisode(episode))}

      {/* Orphaned Follow-ups */}
      {orphanedFollowUps.length > 0 && (
        <div className="border border-yellow-200 rounded-lg overflow-hidden">
          <div
            onClick={() => setShowOrphaned(!showOrphaned)}
            className="
              flex items-center justify-between p-4 bg-yellow-50 cursor-pointer
              hover:bg-yellow-100 transition-colors
            "
          >
            <div className="flex items-center gap-3">
              {showOrphaned ? (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-600" />
              )}
              <div>
                <div className="text-sm font-medium text-slate-900">
                  Previous Documentation
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {orphanedFollowUps.length} visit
                  {orphanedFollowUps.length !== 1 ? 's' : ''} without initial
                  assessment
                </div>
              </div>
            </div>
          </div>

          {showOrphaned && (
            <div className="p-4 space-y-2 bg-yellow-50/50">
              {orphanedFollowUps.map((visit) => renderVisitRow(visit))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
