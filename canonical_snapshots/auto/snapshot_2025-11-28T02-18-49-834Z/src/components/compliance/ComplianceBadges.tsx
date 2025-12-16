import React from 'react';

interface ComplianceBadgeProps {
  type: 'phipa' | 'cpo' | 'ssl' | 'audit';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Compliance Badge Component
 * Displays medical-legal compliance badges for Canadian healthcare context
 */
export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({ 
  type, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const badges = {
    phipa: {
      icon: '🔒',
      text: 'PHIPA Compliant',
      bg: 'bg-blue-100',
      textColor: 'text-blue-800',
      border: 'border-blue-200'
    },
    cpo: {
      icon: '⚕️',
      text: 'CPO Friendly',
      bg: 'bg-purple-100',
      textColor: 'text-purple-800',
      border: 'border-purple-200'
    },
    ssl: {
      icon: '🔐',
      text: 'SSL Secured',
      bg: 'bg-green-100',
      textColor: 'text-green-800',
      border: 'border-green-200'
    },
    audit: {
      icon: '📋',
      text: 'Audit Ready',
      bg: 'bg-amber-100',
      textColor: 'text-amber-800',
      border: 'border-amber-200'
    }
  };

  const badge = badges[type];

  return (
    <div className={`inline-flex items-center ${badge.bg} ${badge.textColor} 
                     rounded-full font-medium border ${badge.border} ${sizeClasses[size]} ${className}`}>
      <span className="mr-1.5 text-base">{badge.icon}</span>
      <span>{badge.text}</span>
    </div>
  );
};

/**
 * Compliance Badges Row Component
 * Displays multiple compliance badges together
 */
interface ComplianceBadgesRowProps {
  badges?: Array<'phipa' | 'cpo' | 'ssl' | 'audit'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ComplianceBadgesRow: React.FC<ComplianceBadgesRowProps> = ({
  badges = ['phipa', 'ssl', 'cpo'],
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {badges.map((badgeType) => (
        <ComplianceBadge key={badgeType} type={badgeType} size={size} />
      ))}
    </div>
  );
};

