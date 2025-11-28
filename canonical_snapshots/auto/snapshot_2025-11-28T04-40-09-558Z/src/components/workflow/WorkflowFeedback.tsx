/**
 * Workflow Feedback Component
 * 
 * Collects user feedback on workflow detection accuracy and efficiency improvements.
 * 
 * @compliance PHIPA compliant
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X, CheckCircle, AlertCircle } from 'lucide-react';
import { FeedbackService } from '../../services/feedbackService';
import { AnalyticsService } from '../../services/analyticsService';

export interface WorkflowFeedbackProps {
  sessionId: string;
  patientId: string;
  userId: string;
  workflowType: 'initial' | 'follow-up';
  detectionConfidence?: number;
  onClose?: () => void;
}

export const WorkflowFeedback: React.FC<WorkflowFeedbackProps> = ({
  sessionId,
  patientId,
  userId,
  workflowType,
  detectionConfidence,
  onClose,
}) => {
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType) return;

    setIsSubmitting(true);

    try {
      // Submit to feedback service
      await FeedbackService.submitFeedback({
        userId,
        patientId,
        sessionId,
        category: 'workflow_optimization',
        rating: feedbackType === 'positive' ? 5 : 2,
        comment: comments,
        metadata: {
          workflowType,
          detectionConfidence,
          feedbackType,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent('workflow_feedback_submitted', {
        sessionId,
        patientId,
        userId,
        workflowType,
        feedbackType,
        detectionConfidence,
        hasComments: comments.length > 0,
      });

      setSubmitted(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error('[WorkflowFeedback] Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Thank you for your feedback!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            How was the workflow detection?
          </h4>
          <p className="text-xs text-gray-600">
            {workflowType === 'follow-up' 
              ? 'Did the optimized follow-up workflow help?'
              : 'Was the initial evaluation workflow correct?'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setFeedbackType('positive')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            feedbackType === 'positive'
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">Helpful</span>
        </button>
        <button
          onClick={() => setFeedbackType('negative')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            feedbackType === 'negative'
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm font-medium">Needs improvement</span>
        </button>
      </div>

      {feedbackType && (
        <div className="mt-3">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Optional: Tell us more about your experience..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowFeedback;

