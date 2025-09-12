import React from 'react';
import { useTrackedAnalysis } from '../hooks/useTrackedAnalysis';

export const AnalysisTracker: React.FC<{ show: boolean }> = ({ show }) => {
  const { lastScore, analysisId, getPerformanceStats } = useTrackedAnalysis();
  
  if (!show) return null;
  
  const stats = getPerformanceStats();
  
  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm">
      <h3 className="font-bold text-sm mb-2">📊 Analysis Tracking</h3>
      
      {lastScore > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs">
            <span>Last Score:</span>
            <span className={lastScore >= 70 ? 'text-green-600' : 'text-orange-600'}>
              {lastScore}/100
            </span>
          </div>
          <div className="text-xs text-gray-500">ID: {analysisId}</div>
        </div>
      )}
      
      <div className="text-xs space-y-1">
        {Object.entries(stats).slice(0, 3).map(([type, data]) => (
          <div key={type} className="flex justify-between">
            <span>{type}:</span>
            <span>{data.avgScore}% (n={data.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
