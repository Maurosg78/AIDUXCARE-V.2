import React from 'react';

interface ScoreIndicatorProps {
  score: number;
  show: boolean;
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ score, show }) => {
  if (!show || score === 0) return null;
  
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getEmoji = () => {
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  };
  
  return (
    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Analysis Quality Score:</span>
        <span className="text-lg font-bold">{score}/100 {getEmoji()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getColor()}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {score < 80 && (
        <p className="text-xs text-gray-600 mt-2">
          Score below 80 indicates missing critical information. Check console for details.
        </p>
      )}
    </div>
  );
};
