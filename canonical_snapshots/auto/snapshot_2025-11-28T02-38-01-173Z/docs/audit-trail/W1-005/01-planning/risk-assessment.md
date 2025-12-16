# Risk Assessment - W1-005

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| R1: Identifier leak before AI | Medium | Existential (PHIPA breach) | Enforce de-ID middleware, block AI if validation fails, log events. |
| R2: Incorrect re-identification (data loss) | Medium | High | Maintain deterministic mapping, unit tests for re-ID, fallback to manual warning. |
| R3: Performance degradation | Low | Medium | Benchmark de-ID service, use regex caching, ensure async pipeline overhead <50ms. |
| R4: Logging sensitive data | Medium | High | Logs store counts + hashes only; prevent raw tokens in audit logger. |
| R5: Dev bypass via feature flag | Low | High | Gate AI calls behind shared helper; lint rule/CI test ensures helper is used. |

Date: 2025-11-27
