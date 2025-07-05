import { vi } from "vitest";
import { AnalyticsEvents } from "../../constants/analytics";

// Mock de UsageAnalyticsService
vi.mock("@/services/UsageAnalyticsService", () => ({
  track: vi.fn(),
  trackMetric: vi.fn(),
  UsageMetricType: AnalyticsEvents,
}));

// Mock de AuditLogger
vi.mock("@/core/audit/AuditLogger", () => ({
  AuditLogger: {
    log: vi.fn(),
  },
}));

// Mock de EMRFormService
vi.mock("@/core/services/EMRFormService", () => ({
  EMRFormService: {
    insertSuggestion: vi.fn(),
    mapSuggestionTypeToEMRSection: vi.fn(),
  },
}));

// Mock de Supabase
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));
