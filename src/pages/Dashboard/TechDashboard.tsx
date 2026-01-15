import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type TechMetrics = {
  date: string;
  totalEvents: number;
  errorCount: number;
  workflowEventCount: number;
  sessionEventCount: number;
  latency?: {
    transcription?: number;
    analysis?: number;
    soap?: number;
  };
  costs?: {
    whisper?: number;
    vertexAI?: number;
    firebase?: number;
    total?: number;
  };
};

export default function TechDashboard() {
  const [metrics, setMetrics] = useState<TechMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      const q = query(
        collection(db, 'metrics_tech'),
        orderBy('date', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setMetrics(snap.docs[0].data() as TechMetrics);
      }
    } catch (err) {
      console.error('[TechDashboard] Error loading metrics', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading metrics…</div>;
  if (!metrics) return <div className="p-8">No metrics available</div>;

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">CTO Dashboard</h1>

      {/* System Health */}
      <section>
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-3 gap-4">
          <Metric label="Total Events" value={metrics.totalEvents} />
          <Metric label="Errors" value={metrics.errorCount} />
          <Metric label="Sessions" value={metrics.sessionEventCount} />
        </div>
      </section>

      {/* Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Performance (avg)</h2>
        <div className="grid grid-cols-3 gap-4">
          <Metric label="Transcription (s)" value={metrics.latency?.transcription ?? '—'} />
          <Metric label="Analysis (s)" value={metrics.latency?.analysis ?? '—'} />
          <Metric label="SOAP Gen (s)" value={metrics.latency?.soap ?? '—'} />
        </div>
      </section>

      {/* Costs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Costs (USD)</h2>
        <div className="grid grid-cols-4 gap-4">
          <Metric label="Whisper" value={metrics.costs?.whisper ?? '—'} />
          <Metric label="Vertex AI" value={metrics.costs?.vertexAI ?? '—'} />
          <Metric label="Firebase" value={metrics.costs?.firebase ?? '—'} />
          <Metric label="Total" value={metrics.costs?.total ?? '—'} />
        </div>
      </section>

      <div className="text-xs text-gray-400">
        Last updated: {metrics.date}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

