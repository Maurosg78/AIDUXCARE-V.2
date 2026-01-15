import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type GrowthMetrics = {
  date: string;
  users: {
    total: number;
    active: number;
    new: number;
    retentionD7: number;
  };
  growth: {
    weekOverWeek: number;
  };
  value: {
    soapsGenerated: number;
    timeSavedMinutes: number;
    completionRate: number;
    cpoCompliance: number;
  };
  costs: {
    perSession: number;
  };
};

export default function GrowthDashboard() {
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 24 * 60 * 60 * 1000); // daily
    return () => clearInterval(interval);
  }, []);

  async function loadMetrics() {
    try {
      const q = query(
        collection(db, 'metrics_growth'),
        orderBy('date', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setMetrics(snap.docs[0].data() as GrowthMetrics);
      }
    } catch (err) {
      console.error('[GrowthDashboard] Error loading metrics', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading growth metrics…</div>;
  if (!metrics) return <div className="p-8">No growth data available</div>;

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">Growth Dashboard</h1>

      {/* Traction */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Traction</h2>
        <div className="grid grid-cols-4 gap-4">
          <Metric label="Total Users" value={metrics.users.total} />
          <Metric label="Active (7d)" value={metrics.users.active} />
          <Metric label="New Users" value={metrics.users.new} />
          <Metric label="D7 Retention (%)" value={(metrics.users.retentionD7 * 100).toFixed(0)} />
        </div>
      </section>

      {/* Growth */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Growth</h2>
        <div className="grid grid-cols-2 gap-4">
          <Metric label="WoW Growth (%)" value={(metrics.growth.weekOverWeek * 100).toFixed(1)} />
          <Metric label="Cost / Session ($)" value={metrics.costs.perSession.toFixed(2)} />
        </div>
      </section>

      {/* Value */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Value Delivered</h2>
        <div className="grid grid-cols-4 gap-4">
          <Metric label="SOAPs Generated" value={metrics.value.soapsGenerated} />
          <Metric label="Time Saved (hrs)" value={Math.round(metrics.value.timeSavedMinutes / 60)} />
          <Metric label="Completion Rate (%)" value={(metrics.value.completionRate * 100).toFixed(0)} />
          <Metric label="CPO Compliance (%)" value={(metrics.value.cpoCompliance * 100).toFixed(0)} />
        </div>
      </section>

      {/* Investor Summary */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Investor Snapshot</h2>
        <ul className="space-y-1 text-sm">
          <li>• {metrics.value.soapsGenerated} SOAPs generated</li>
          <li>• {(metrics.users.retentionD7 * 100).toFixed(0)}% D7 retention</li>
          <li>• {(metrics.growth.weekOverWeek * 100).toFixed(1)}% WoW growth</li>
          <li>• ${metrics.costs.perSession.toFixed(2)} cost per session</li>
        </ul>
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



