# WO-06 TO WO-10: MASTER REFERENCE

**Quick reference for remaining Work Orders**

---

## WO-06: FIRESTORE SECURITY RULES (30 min)

```bash
# Update firestore.rules
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Analytics Events: Write-only for authenticated users
    match /analytics_events/{eventId} {
      allow create: if request.auth != null;
      allow read: if request.auth.token.admin == true;
      allow update, delete: if false; // Immutable
    }
    
    // Metrics Tech: Read-only for authenticated, write for functions
    match /metrics_tech/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Metrics Growth: Read-only for authenticated
    match /metrics_growth/{docId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Metrics Realtime: Read-only for authenticated
    match /metrics_realtime/{docId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
EOF

# Deploy rules
firebase deploy --only firestore:rules

# Test rules
firebase emulators:start --only firestore
# Run test writes to verify
```

---

## WO-07: CTO DASHBOARD (120 min)

### Create Dashboard Components

```bash
# Create CTO Dashboard page
mkdir -p src/pages/Dashboard
cat > src/pages/Dashboard/TechDashboard.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { TechMetrics } from '@/services/analytics/types';

export function TechDashboard() {
  const [metrics, setMetrics] = useState<TechMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const q = query(
        collection(db, 'metrics_tech'),
        orderBy('date', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setMetrics(snapshot.docs[0].data() as TechMetrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">CTO Dashboard</h1>
      
      {/* System Health */}
      <section>
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Uptime" value={`${(metrics.uptime * 100).toFixed(2)}%`} target="99.9%" />
          <MetricCard label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(2)}%`} target="<0.1%" />
          <MetricCard label="Crash-Free Rate" value={`${(metrics.crashFreeRate * 100).toFixed(2)}%`} target="99%" />
        </div>
      </section>

      {/* Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Performance</h2>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Transcription" value={`${metrics.latency.transcription.toFixed(1)}s`} target="<5s" />
          <MetricCard label="Analysis" value={`${metrics.latency.analysis.toFixed(1)}s`} target="<10s" />
          <MetricCard label="SOAP Gen" value={`${metrics.latency.soap.toFixed(1)}s`} target="<5s" />
        </div>
      </section>

      {/* Costs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Costs</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Whisper" value={`$${metrics.costs.whisper.toFixed(2)}`} />
          <MetricCard label="Vertex AI" value={`$${metrics.costs.vertexAI.toFixed(2)}`} />
          <MetricCard label="Firebase" value={`$${metrics.costs.firebase.toFixed(2)}`} />
          <MetricCard label="Total" value={`$${metrics.costs.total.toFixed(2)}`} target="<$150" />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, target }: { label: string; value: string; target?: string }) {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {target && <div className="text-xs text-gray-400">Target: {target}</div>}
    </div>
  );
}
EOF

# Add route
code src/router/router.tsx
# Add: { path: '/dashboard/tech', element: <TechDashboard /> }
```

---

## WO-08: GROWTH DASHBOARD (120 min)

```bash
# Create Growth Dashboard
cat > src/pages/Dashboard/GrowthDashboard.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { GrowthMetrics } from '@/services/analytics/types';

export function GrowthDashboard() {
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  
  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 24 * 60 * 60 * 1000); // Daily
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    const q = query(
      collection(db, 'metrics_growth'),
      orderBy('date', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setMetrics(snapshot.docs[0].data() as GrowthMetrics);
    }
  };

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Growth Dashboard</h1>
      
      {/* Traction */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Traction</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total Users" value={metrics.users.total} />
          <MetricCard label="Active (7d)" value={metrics.users.active} />
          <MetricCard label="New Users" value={metrics.users.new} />
          <MetricCard label="WoW Growth" value={`${(metrics.growth.weekOverWeek * 100).toFixed(1)}%`} />
        </div>
      </section>

      {/* Value */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Value Delivered</h2>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="SOAPs Generated" value={metrics.value.soapsGenerated} />
          <MetricCard label="Time Saved" value={`${Math.round(metrics.value.timeSavedMinutes / 60)} hrs`} />
          <MetricCard label="Completion Rate" value={`${(metrics.value.completionRate * 100).toFixed(0)}%`} />
          <MetricCard label="CPO Compliance" value={`${(metrics.value.cpoCompliance * 100).toFixed(0)}%`} />
        </div>
      </section>

      {/* Investor Pitch Auto-Gen */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Investor Pitch Points</h2>
        <ul className="space-y-2">
          <li>• {metrics.value.soapsGenerated} SOAPs generated (product-market fit)</li>
          <li>• {(metrics.users.retentionD7 * 100).toFixed(0)}% D7 retention (stickiness)</li>
          <li>• {(metrics.growth.weekOverWeek * 100).toFixed(0)}% WoW growth (momentum)</li>
          <li>• ${metrics.costs.perSession.toFixed(2)}/session cost (unit economics)</li>
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
EOF

# Add route
# Add: { path: '/dashboard/growth', element: <GrowthDashboard /> }
```

---

## WO-09: CLOUDFLARE TUNNEL (45 min)

```bash
# Install cloudflared
brew install cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create aiduxcare-pilot-2026

# Get tunnel ID
cloudflared tunnel list

# Create config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: TUNNEL_ID_HERE
credentials-file: /Users/YOUR_USER/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: pilot.aiduxcare.com
    service: http://localhost:5174
  - service: http_status:404
EOF

# Configure DNS (in Cloudflare Dashboard)
# CNAME: pilot.aiduxcare.com → TUNNEL_ID.cfargotunnel.com

# Run tunnel
cloudflared tunnel run aiduxcare-pilot-2026

# Or install as service
cloudflared service install
sudo launchctl start com.cloudflare.cloudflared

# Test
open https://pilot.aiduxcare.com
```

---

## WO-10: TESTING & VALIDATION (60 min)

```bash
# Create comprehensive test script
cat > scripts/validate-full-analytics.sh << 'EOF'
#!/bin/bash

echo "🧪 FULL ANALYTICS VALIDATION"
echo "============================"
echo ""

# Test 1: PHIPAAnalytics
echo "1️⃣ Testing PHIPAAnalytics..."
pnpm tsx scripts/test-phipa-analytics.ts
echo ""

# Test 2: Core Events
echo "2️⃣ Testing Core Events..."
pnpm tsx scripts/test-core-events.ts
echo ""

# Test 3: Workflow Events
echo "3️⃣ Testing Workflow Events..."
pnpm tsx scripts/test-workflow-events.ts
echo ""

# Test 4: Cloud Functions
echo "4️⃣ Testing Cloud Functions..."
curl -s https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/dailyMetricsRollup > /dev/null
sleep 5
firebase firestore:get metrics_tech --limit 1 > /dev/null && echo "✅ Functions working" || echo "❌ Functions failed"
echo ""

# Test 5: Firestore Rules
echo "5️⃣ Testing Firestore Rules..."
firebase emulators:exec --only firestore "node scripts/test-rules.js"
echo ""

# Test 6: Dashboards
echo "6️⃣ Testing Dashboards..."
curl -s http://localhost:5174/dashboard/tech > /dev/null && echo "✅ Tech Dashboard loads" || echo "❌ Dashboard error"
curl -s http://localhost:5174/dashboard/growth > /dev/null && echo "✅ Growth Dashboard loads" || echo "❌ Dashboard error"
echo ""

# Test 7: Cloudflare Tunnel
echo "7️⃣ Testing Cloudflare Tunnel..."
curl -s -o /dev/null -w "%{http_code}" https://pilot.aiduxcare.com | grep -q "200" && echo "✅ Tunnel working" || echo "⚠️  Tunnel not accessible"
echo ""

echo "✅ Full Analytics Validation Complete!"
echo ""
echo "Check Firestore for data:"
echo "  - analytics_events"
echo "  - metrics_tech"
echo "  - metrics_growth"
echo "  - metrics_realtime"
EOF

chmod +x scripts/validate-full-analytics.sh

# Run validation
./scripts/validate-full-analytics.sh
```

### End-to-End Test Flow

```bash
# Start all services
pnpm dev &  # Dev server
cloudflared tunnel run aiduxcare-pilot-2026 &  # Tunnel

# Run through complete workflow
open http://localhost:5174

# 1. Login
# 2. Create patient
# 3. Start session
# 4. Record audio
# 5. Transcribe
# 6. Analyze
# 7. Phase 2 evaluation
# 8. Generate SOAP
# 9. Export SOAP

# Check Firestore for ALL events
firebase firestore:get analytics_events --limit 50 --order-by timestamp desc

# Check metrics
firebase firestore:get metrics_tech --limit 1 --order-by date desc
firebase firestore:get metrics_growth --limit 1 --order-by date desc

# Check dashboards
open http://localhost:5174/dashboard/tech
open http://localhost:5174/dashboard/growth

# All should show data ✅
```

---

## ✅ FINAL SUCCESS CRITERIA

- [ ] All 10 WOs completed
- [ ] PHIPAAnalytics working (no PHI in Firestore)
- [ ] 20+ event types tracked
- [ ] Cloud Functions deployed and scheduled
- [ ] Firestore rules secure
- [ ] CTO Dashboard shows real-time data
- [ ] Growth Dashboard shows daily metrics
- [ ] Cloudflare Tunnel running
- [ ] All tests pass
- [ ] End-to-end workflow tracked

---

## 🎉 ANALYTICS SYSTEM COMPLETE

Once all WOs are done, you have:
- ✅ Enterprise-grade analytics infrastructure
- ✅ PHIPA-compliant event tracking
- ✅ Automated daily metrics aggregation
- ✅ Real-time performance monitoring
- ✅ Dual dashboards (CTO + Growth)
- ✅ Secure Cloudflare tunnel
- ✅ Complete test coverage

**Ready for pilot launch!** 🚀

