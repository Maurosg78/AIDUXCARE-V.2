/**
 * AiDuxCare — LegalAuditDashboard
 * Market: CA | Language: en-CA
 * Phase: 2B — Filters + CSV Export
 * WO: WO-2024-002
 */

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
  const [filter, setFilter] = useState<"all" | "active" | "withdrawn">("all");
  const [csv, setCsv] = useState<string>("");

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

  /** Apply filter */
  const filteredLogs = logs.filter((log) => {
    if (filter === "active") return !log.withdrawn;
    if (filter === "withdrawn") return log.withdrawn;
    return true;
  });

  /** CSV Export */
  const handleExport = () => {
    const header = "user_id,consent_version,consent_date,withdrawn";
    const rows = filteredLogs.map(
      (r) =>
        `${r.user_id},${r.consent_version},${r.consent_date},${r.withdrawn}`,
    );
    const content = [header, ...rows].join("\n");
    setCsv(content);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consent_audit_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🧾 Legal Consent Audit Dashboard</h1>
        <button
          onClick={handleExport}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          📤 Export CSV
        </button>
      </div>

      <div className="flex space-x-3 mt-4">
        {["all", "active", "withdrawn"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded-md border text-sm ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <table className="min-w-full text-sm border mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 border">User</th>
            <th className="px-2 py-1 border">Version</th>
            <th className="px-2 py-1 border">Date</th>
            <th className="px-2 py-1 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id}>
              <td className="border px-2 py-1">{log.user_id}</td>
              <td className="border px-2 py-1">{log.consent_version}</td>
              <td className="border px-2 py-1">
                {new Date(log.consent_date).toLocaleString()}
              </td>
              <td
                className={`border px-2 py-1 ${
                  log.withdrawn ? "text-red-600" : "text-green-700"
                }`}
              >
                {log.withdrawn ? "❌ Withdrawn" : "✅ Active"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {csv && (
        <div className="mt-4 p-2 bg-gray-50 border rounded text-xs text-gray-500 whitespace-pre-wrap">
          {csv}
        </div>
      )}
    </div>
  );
};

export default LegalAuditDashboard;
