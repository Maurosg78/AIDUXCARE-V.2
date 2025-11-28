/**
 * Work Queue Panel
 * 
 * Sprint 3: Unified Command Centre
 * Bloque 3: Cola administrativa global (pending notes, consents, etc.)
 */

import React, { useState } from 'react';
import { FileText, AlertCircle, Scroll, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface WorkQueueSummary {
  pendingNotes: number;
  missingConsents: number;
  draftDocuments: number;
}

export interface WorkQueuePanelProps {
  workQueue: WorkQueueSummary;
  loading: boolean;
}

export const WorkQueuePanel: React.FC<WorkQueuePanelProps> = ({
  workQueue,
  loading,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasItems = workQueue.pendingNotes > 0 || workQueue.missingConsents > 0 || workQueue.draftDocuments > 0;
  const totalItems = workQueue.pendingNotes + workQueue.missingConsents + workQueue.draftDocuments;

  return (
    <div id="work-queue" className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors rounded-t-2xl"
      >
        <div className="flex-1 text-left">
          <h2 className="text-xl font-semibold text-gray-900 font-apple mb-1">
            Work Queue
          </h2>
          <p className="text-base text-gray-600 font-apple font-light">
            {hasItems ? `${totalItems} item${totalItems > 1 ? 's' : ''} requiring attention` : 'No pending items'}
          </p>
        </div>
        <div className="flex-shrink-0 ml-4 flex items-center gap-3">
          {hasItems && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold font-apple">
              {totalItems}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
            {/* Pending Notes Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all duration-200 flex flex-col min-h-[160px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                    Pending Notes
                  </h3>
                  {loading ? (
                    <div className="text-sm text-gray-500 font-apple">Loading...</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 font-apple">
                      {workQueue.pendingNotes}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 font-apple font-light mb-4 flex-1">
                Notes that must be reviewed and signed
              </p>
              
              <button
                onClick={() => navigate('/notes/pending')}
                className="w-full px-4 py-3 bg-white hover:bg-primary-blue/5 border border-gray-200 hover:border-primary-blue/30 rounded-xl transition-all duration-200 text-sm font-semibold text-gray-900 font-apple"
              >
                Review Notes
              </button>
            </div>

            {/* Draft Support Documents Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all duration-200 flex flex-col min-h-[160px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-xl flex items-center justify-center">
                  <Scroll className="w-6 h-6 text-primary-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                    Draft Documents
                  </h3>
                  {loading ? (
                    <div className="text-sm text-gray-500 font-apple">Loading...</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 font-apple">
                      {workQueue.draftDocuments}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 font-apple font-light mb-4 flex-1">
                Draft support documents (future)
              </p>
              
              <button
                disabled
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-400 font-apple cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>

            {/* Missing Consents Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all duration-200 flex flex-col min-h-[160px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-primary-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 font-apple mb-1">
                    Missing Consents
                  </h3>
                  {loading ? (
                    <div className="text-sm text-gray-500 font-apple">Loading...</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 font-apple">
                      {workQueue.missingConsents}
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 font-apple font-light mb-4 flex-1">
                Patients requiring consent review
              </p>
              
              <button
                onClick={() => navigate('/consents')}
                className="w-full px-4 py-3 bg-white hover:bg-primary-blue/5 border border-gray-200 hover:border-primary-blue/30 rounded-xl transition-all duration-200 text-sm font-semibold text-gray-900 font-apple"
              >
                Review Consents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


