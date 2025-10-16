# AiDuxCare V2

[![Data Validation (Zod)](https://github.com/Maurosg78/AIDUXCARE-V.2/actions/workflows/data-validation.yml/badge.svg)](https://github.com/Maurosg78/AIDUXCARE-V.2/actions/workflows/data-validation.yml)
[![SoT Trailers](https://github.com/Maurosg78/AIDUXCARE-V.2/actions/workflows/sot-trailers.yml/badge.svg)](https://github.com/Maurosg78/AIDUXCARE-V.2/actions/workflows/sot-trailers.yml)

## Data Validation (Zod)
Quality gate de datos (docs-only thread). No requiere emulador para correr tests.

### Run local (sin watcher)
```bash
npm run -s validate:data
Data Validation (Zod): corre en PR/push sobre src/validation/**, test/validation/**, test-data/**

SoT Trailers: falla si faltan trailers de Source of Truth

Market: CA · Language: en-CA
