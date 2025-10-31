import React, { useEffect, useState } from "react";
import { supabase } from "../services/ConsentAuditService";

interface LogEntry {
  id: string;
  user_id: string;
  consent_version: string;
  consent_date: string;
  withdrawn: boolean;
}

export const LegalAuditDashboard: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from("consent_logs")
        .select("*")
        .order("consent_date", { ascending: false });
      if (error) console.error(error);
      else setLogs(data || []);
    }
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧾 Legal Consent Audit Logs</h1>
      <table className="min-w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 border">User</th>
            <th className="px-2 py-1 border">Version</th>
            <th className="px-2 py-1 border">Date</th>
            <th className="px-2 py-1 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="border px-2 py-1">{log.user_id}</td>
              <td className="border px-2 py-1">{log.consent_version}</td>
              <td className="border px-2 py-1">
                {new Date(log.consent_date).toLocaleString()}
              </td>
              <td className="border px-2 py-1">
                {log.withdrawn ? "❌ Withdrawn" : "✅ Active"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LegalAuditDashboard;
