import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { isSpainPilot } from '@/core/pilotDetection';

type GrowthMetricRow = {
  id: string;
  date: string;
  uniqueUsers: number;
  uniqueSessions: number;
  userEventCount: number;
};

type TechMetricRow = {
  id: string;
  date: string;
  totalEvents: number;
  errorCount: number;
  workflowEventCount: number;
};

type FeedbackRow = {
  id: string;
  resolved: boolean;
  severity: string;
  description: string;
  timestamp: Date | null;
};

type SessionEventRow = {
  id: string;
  eventName: string;
  patientId: string;
  timestamp: Date | null;
};

type ActivityRow = {
  date: string;
  uniqueUsers: number;
  uniqueSessions: number;
  workflowEventCount: number;
};

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    const timestampDate = value.toDate();
    return timestampDate;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsedDate = new Date(value);
    const isValidDate = !Number.isNaN(parsedDate.getTime());
    return isValidDate ? parsedDate : null;
  }

  return null;
}

function formatSpanishDate(value: Date | null): string {
  if (!value) {
    return 'Sin fecha';
  }

  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);

  return formattedDate;
}

function formatSpanishDateTime(value: Date | null): string {
  if (!value) {
    return 'Sin fecha';
  }

  const formattedDateTime = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);

  return formattedDateTime;
}

function maskPatientId(patientId: string): string {
  if (!patientId) {
    return 'Sin paciente';
  }

  const visiblePrefix = patientId.slice(0, 4);
  const maskedValue = `${visiblePrefix}***`;
  return maskedValue;
}

function truncateDescription(value: string): string {
  const maxLength = 80;

  if (value.length <= maxLength) {
    return value;
  }

  const truncatedValue = `${value.slice(0, maxLength - 1)}…`;
  return truncatedValue;
}

function severityBadgeClasses(severity: string): string {
  const normalizedSeverity = severity.toLowerCase();

  if (normalizedSeverity === 'critical') {
    return 'bg-red-100 text-red-700 border-red-200';
  }

  if (normalizedSeverity === 'high') {
    return 'bg-orange-100 text-orange-700 border-orange-200';
  }

  if (normalizedSeverity === 'medium') {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function PilotMetricsDashboard() {
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetricRow[]>([]);
  const [techMetrics, setTechMetrics] = useState<TechMetricRow[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackRow[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const growthQuery = query(
          collection(db, 'metrics_growth'),
          orderBy('date', 'desc'),
          limit(14)
        );
        const techQuery = query(
          collection(db, 'metrics_tech'),
          orderBy('date', 'desc'),
          limit(14)
        );
        const feedbackQuery = query(
          collection(db, 'user_feedback'),
          orderBy('timestamp', 'desc')
        );
        const workflowEventsQuery = query(
          collection(db, 'analytics_events'),
          where('eventName', '==', 'workflow_session_started'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const pilotEventsQuery = query(
          collection(db, 'analytics_events'),
          where('eventName', '==', 'pilot_session_started'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );

        const growthSnapshotPromise = getDocs(growthQuery);
        const techSnapshotPromise = getDocs(techQuery);
        const feedbackSnapshotPromise = getDocs(feedbackQuery);
        const workflowSnapshotPromise = getDocs(workflowEventsQuery);
        const pilotSnapshotPromise = getDocs(pilotEventsQuery);

        const growthSnapshot = await growthSnapshotPromise;
        const techSnapshot = await techSnapshotPromise;
        const feedbackSnapshot = await feedbackSnapshotPromise;
        const workflowSnapshot = await workflowSnapshotPromise;
        const pilotSnapshot = await pilotSnapshotPromise;

        const growthRows = growthSnapshot.docs.map((doc) => {
          const rowData = doc.data();
          const metricRow: GrowthMetricRow = {
            id: doc.id,
            date: String(rowData.date ?? ''),
            uniqueUsers: Number(rowData.uniqueUsers ?? 0),
            uniqueSessions: Number(rowData.uniqueSessions ?? 0),
            userEventCount: Number(rowData.userEventCount ?? 0),
          };
          return metricRow;
        });

        const techRows = techSnapshot.docs.map((doc) => {
          const rowData = doc.data();
          const metricRow: TechMetricRow = {
            id: doc.id,
            date: String(rowData.date ?? ''),
            totalEvents: Number(rowData.totalEvents ?? 0),
            errorCount: Number(rowData.errorCount ?? 0),
            workflowEventCount: Number(rowData.workflowEventCount ?? 0),
          };
          return metricRow;
        });

        const feedbackRows = feedbackSnapshot.docs.map((doc) => {
          const rowData = doc.data();
          const feedbackRow: FeedbackRow = {
            id: doc.id,
            resolved: Boolean(rowData.resolved),
            severity: String(rowData.severity ?? 'unknown'),
            description: String(rowData.description ?? ''),
            timestamp: toDate(rowData.timestamp),
          };
          return feedbackRow;
        });

        const workflowRows = workflowSnapshot.docs.map((doc) => {
          const rowData = doc.data();
          const eventData = rowData.eventData ?? {};
          const sessionEvent: SessionEventRow = {
            id: doc.id,
            eventName: String(rowData.eventName ?? ''),
            patientId: String(eventData.patientId ?? ''),
            timestamp: toDate(rowData.timestamp),
          };
          return sessionEvent;
        });

        const pilotRows = pilotSnapshot.docs.map((doc) => {
          const rowData = doc.data();
          const eventData = rowData.eventData ?? {};
          const sessionEvent: SessionEventRow = {
            id: doc.id,
            eventName: String(rowData.eventName ?? ''),
            patientId: String(eventData.patientId ?? ''),
            timestamp: toDate(rowData.timestamp),
          };
          return sessionEvent;
        });

        const combinedSessionRows = [...workflowRows, ...pilotRows];
        const sortedSessionRows = combinedSessionRows.sort((left, right) => {
          const leftTime = left.timestamp?.getTime() ?? 0;
          const rightTime = right.timestamp?.getTime() ?? 0;
          return rightTime - leftTime;
        });
        const limitedSessionRows = sortedSessionRows.slice(0, 20);

        setGrowthMetrics(growthRows);
        setTechMetrics(techRows);
        setFeedbackItems(feedbackRows);
        setSessionEvents(limitedSessionRows);
      } catch (error) {
        console.error('[PilotMetricsDashboard] Error loading metrics', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const today = useMemo(() => {
    const todayValue = new Date();
    return todayValue;
  }, []);

  const uniqueUsersLast7Days = useMemo(() => {
    const lastSevenRows = growthMetrics.slice(0, 7);
    const totalUniqueUsers = lastSevenRows.reduce((sum, row) => sum + row.uniqueUsers, 0);
    return totalUniqueUsers;
  }, [growthMetrics]);

  const activityRows = useMemo(() => {
    const techByDate = new Map<string, TechMetricRow>();

    for (const techRow of techMetrics) {
      techByDate.set(techRow.date, techRow);
    }

    const mergedRows = growthMetrics.map((growthRow) => {
      const techRow = techByDate.get(growthRow.date);
      const activityRow: ActivityRow = {
        date: growthRow.date,
        uniqueUsers: growthRow.uniqueUsers,
        uniqueSessions: growthRow.uniqueSessions,
        workflowEventCount: techRow?.workflowEventCount ?? 0,
      };
      return activityRow;
    });

    return mergedRows;
  }, [growthMetrics, techMetrics]);

  const totalFeedback = feedbackItems.length;
  const pendingFeedback = feedbackItems.filter((item) => !item.resolved);
  const resolvedFeedback = feedbackItems.filter((item) => item.resolved);

  if (!isSpainPilot()) {
    return <Navigate to="/command-center" replace />;
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-6 py-10 text-slate-600">Cargando métricas del piloto…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">
              AiduxCare España
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Panel de Piloto — AiduxCare España
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Fecha de hoy: {formatSpanishDate(today)}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 px-5 py-4 text-blue-900">
            <p className="text-sm font-medium">Usuarios únicos últimos 7 días</p>
            <p className="mt-1 text-3xl font-semibold">{uniqueUsersLast7Days}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Actividad (últimos 14 días)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Usuarios, sesiones y workflows agregados por fecha.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4 font-medium">Fecha</th>
                <th className="py-3 pr-4 font-medium">Usuarios únicos</th>
                <th className="py-3 pr-4 font-medium">Sesiones</th>
                <th className="py-3 pr-4 font-medium">Workflows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activityRows.map((row) => (
                <tr key={row.date} className="text-slate-800">
                  <td className="py-3 pr-4">{row.date}</td>
                  <td className="py-3 pr-4">{row.uniqueUsers}</td>
                  <td className="py-3 pr-4">{row.uniqueSessions}</td>
                  <td className="py-3 pr-4">{row.workflowEventCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Feedback del piloto</h2>
          <p className="mt-1 text-sm text-slate-600">
            Estado operativo de incidencias y sugerencias reportadas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalFeedback}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Pendientes</p>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{pendingFeedback.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Resueltos</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{resolvedFeedback.length}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {pendingFeedback.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityBadgeClasses(item.severity)}`}>
                  {item.severity}
                </span>
                <p className="text-sm text-slate-800">{truncateDescription(item.description)}</p>
              </div>
              <p className="text-xs text-slate-500">{formatSpanishDate(item.timestamp)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Sesiones recientes</h2>
          <p className="mt-1 text-sm text-slate-600">
            Últimos eventos de inicio de sesión clínica del piloto.
          </p>
        </div>
        <div className="space-y-3">
          {sessionEvents.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{formatSpanishDateTime(item.timestamp)}</p>
                <p className="text-xs text-slate-500">{item.eventName}</p>
              </div>
              <p className="text-sm text-slate-700">{maskPatientId(item.patientId)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
