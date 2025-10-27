import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SystemAlert } from '../../components/alerts/SystemAlert';

interface Log {
  id: number;
  action: string;
  timestamp: string;
}

export const AuditViewer: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<Log[]>([]);
  const [alert, setAlert] = useState<'success' | 'error' | 'info' | null>(null);

  const simulateSave = () => {
    try {
      const newLog = { id: Date.now(), action: t('system.logSaved'), timestamp: new Date().toISOString() };
      setLogs([newLog, ...logs]);
      setAlert('success');
    } catch {
      setAlert('error');
    }
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{t('system.auditLogs') || 'Audit Logs'}</h2>

      {alert && <SystemAlert type={alert} messageKey={alert === 'success' ? 'system.logSaved' : 'system.logError'} />}

      <button
        onClick={simulateSave}
        className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4 hover:bg-blue-700 transition"
      >
        {t('system.saveLog') || 'Save Log'}
      </button>

      <ul className="divide-y divide-gray-200">
        {logs.length === 0 ? (
          <li className="py-2 text-gray-500">{t('system.noLogs') || 'No logs recorded yet.'}</li>
        ) : (
          logs.map((log) => (
            <li key={log.id} className="py-2 text-sm text-gray-700">
              {log.timestamp}: {log.action}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
