# AiduxCare — Gotchas & Lessons Learned
**Market:** CA · **Language:** en-CA

| Area | Gotcha | Mitigation |
|-------|---------|------------|
| Firestore | Indexed queries can silently fail if composite missing | Always define composite indices for patientId+status |
| Langfuse | May log PHI if prompts unfiltered | Use local proxy scrubber |
| Husky hooks | Block commits if missing tags | Add tags early with template alias |
| Supabase metrics | Slow cold starts on EU region | Migrate analytics to CA region |
| UI copy | Mixed ES/EN strings in tests | Guard via i18n test |
