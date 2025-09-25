# Security Policy

## Reporting a Vulnerability
Please email security contacts listed in CODEOWNERS or open a private security advisory on GitHub. Provide:
- Impact and affected components
- Steps to reproduce (PoC)
- Suggested mitigation (if any)

We acknowledge within 2 business days and provide an ETA for fix.

## Handling Secrets
- No secrets in code or Git history.
- Use environment variables and secret managers (Firebase/Cloud).
- Rotations must be recorded in internal runbooks.

## Dependencies
- Dependencies are tracked via weekly updates (Dependabot/Renovate).  
- Breaking updates require an issue + rollback plan.
