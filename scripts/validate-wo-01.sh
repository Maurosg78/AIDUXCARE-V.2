#!/bin/bash
echo "🔍 Validating WO-01 Setup..."

# Check directories
[ -d "src/services/analytics" ] && echo "✅ Analytics dir" || echo "❌ Missing analytics dir"
[ -d "src/hooks/analytics" ] && echo "✅ Hooks dir" || echo "❌ Missing hooks dir"
[ -d "src/components/dashboard" ] && echo "✅ Dashboard dir" || echo "❌ Missing dashboard dir"

# Check dependencies
pnpm list firebase --depth=0 > /dev/null 2>&1 && echo "✅ Firebase installed" || echo "❌ Firebase missing"
pnpm list recharts --depth=0 > /dev/null 2>&1 && echo "✅ Recharts installed" || echo "❌ Recharts missing"
pnpm list date-fns --depth=0 > /dev/null 2>&1 && echo "✅ date-fns installed" || echo "❌ date-fns missing"
pnpm list lucide-react --depth=0 > /dev/null 2>&1 && echo "✅ lucide-react installed" || echo "❌ lucide-react missing"

# Check placeholder files
[ -f "src/services/analytics/PHIPAAnalytics.ts" ] && echo "✅ PHIPAAnassing placeholder"
[ -f "src/services/analytics/types.ts" ] && echo "✅ types.ts" || echo "⚠️  types.ts pending"

# Check indexes
[ -f "firestore.indexes.json" ] && echo "✅ Indexes file exists" || echo "❌ No indexes file"

# Check Firebase config
grep -q "getAnalytics" src/lib/firebase.ts && echo "✅ Firebase Analytics configured" || echo "⚠️  Analytics not in config"

echo ""
echo "WO-01 validation complete."
echo "If all ✅, proceed to WO-02"
