# Security Policy

## Supported Versions

This project tracks security updates on the latest published extension version and the current `master` branch.

## Reporting a Vulnerability

Please open a private security report via GitHub Security Advisories if available, or open an issue with the `security` label for non-sensitive findings.

## Dependency Audit Policy

- CI fails on `high` and `critical` vulnerabilities.
- `moderate` and lower are reviewed case-by-case.
- Exceptions are documented below when there is no upstream fix.

## Current Exceptions

No active exceptions as of 2026-06-28.

Audit snapshot for release preparation (v0.4.6, 2026-06-28):
- `npm audit`: 0 vulnerabilities
- `npm audit --omit=dev`: 0 vulnerabilities

## Review Cadence

- Re-check `npm audit` on dependency updates and before release packaging.
- Revisit all exceptions at least once per month.