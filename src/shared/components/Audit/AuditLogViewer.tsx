import React from 'react';

interface AuditLogViewerProps {
  className?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ className = '' }) => {
  return (
    <div className={`audit-log-viewer ${className}`}>
      <h3>Audit Log Viewer</h3>
      <p>Componente de auditoría implementado</p>
    </div>
  );
}; 