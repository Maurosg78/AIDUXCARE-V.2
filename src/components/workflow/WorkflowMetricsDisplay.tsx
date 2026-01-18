/**
 * Workflow Metrics Display Component
 * 
 * Displays efficiency metrics for workflow optimization.
 * 
 * @compliance PHIPA-aware (design goal)
 */

import React from 'react';
import { Clock, Zap, MousePointerClick, TrendingDown } from 'lucide-react';
import { getWorkflowEfficiencySummary, type WorkflowMetrics } from '../../services/workflowMetricsService';

export interface WorkflowMetricsDisplayProps {
  metrics: WorkflowMetrics;
  className?: string;
}

export const WorkflowMetricsDisplay: React.FC<WorkflowMetricsDisplayProps> = ({
  metrics,
  className = '',
}) => {
  const efficiency = getWorkflowEfficiencySummary(metrics);

  if (metrics.workflowType === 'initial') {
    return null; // Don't show metrics for initial evaluations
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-green-600" />
        <h4 className="text-sm font-semibold text-green-900">
          Workflow Optimization Active
        </h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Time Saved */}
        {efficiency.timeSaved > 0 && (
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Time Saved</span>
            </div>
            <p className="text-lg font-semibold text-green-700">
              {Math.floor(efficiency.timeSaved / 60)}min
            </p>
          </div>
        )}

        {/* Token Reduction */}
        {efficiency.tokenReduction > 0 && (
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Token Reduction</span>
            </div>
            <p className="text-lg font-semibold text-green-700">
              {efficiency.tokenReduction}%
            </p>
          </div>
        )}

        {/* Click Reduction */}
        {efficiency.clickReduction > 0 && (
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <MousePointerClick className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Fewer Clicks</span>
            </div>
            <p className="text-lg font-semibold text-green-700">
              {efficiency.clickReduction}%
            </p>
          </div>
        )}

        {/* Workflow Type */}
        <div className="bg-white rounded-lg p-3 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Workflow</span>
          </div>
          <p className="text-sm font-semibold text-green-700">
            Follow-up
          </p>
        </div>
      </div>

      {efficiency.efficiencyGain && (
        <p className="mt-3 text-xs text-green-800 font-medium">
          {efficiency.efficiencyGain}
        </p>
      )}
    </div>
  );
};

export default WorkflowMetricsDisplay;


