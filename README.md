[![CI](https://github.com/Maurosg78/AIDUXCARE-V.2/actions/workflows/ci.yml/badge.svg)](https://github.com/Maurosg78/AIDUXCARE-V.2/actions/workflows/ci.yml)

# AiduxCare V2

[![CI](https://github.com/Maurosg78/AIDUXCARE-V.2/actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%E2%89%A520.x-blue)
![License](https://img.shields.io/badge/license-Private-inactive)

**Single Source of Truth (SSoT)** for onboarding and investors lives in:  
- **Project Handbook** → [`/docs/PROJECT_HANDBOOK.md`](docs/PROJECT_HANDBOOK.md)  
- **Processes** (DoR/DoD, Release) → [`/docs/processes`](docs/processes)  
- **Technical** (Architecture, Deployment, API) → [`/docs/technical`](docs/technical)

### Quick start (dev)
- Requirements: Node ≥ 20, npm ≥ 10
- Install: `npm ci`
- Build: `npm run build`
- Tests (JS/TS): `npm test`
- **Python legacy tests are isolated**: see `tests/_legacy_python` (not executed in CI)

### Contributing
See [`CONTRIBUTING.md`](CONTRIBUTING.md). PRs must:
- Be in **English**
- Reference the relevant Handbook sections (deep links)
- Pass CI (docs-only PRs are CI-light)
