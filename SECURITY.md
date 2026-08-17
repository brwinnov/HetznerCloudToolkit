# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.5.x   | ✅        |
| 0.4.x   | ⚠️ Critical fixes only |
| < 0.4   | ❌        |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately via **GitHub Private Vulnerability Reporting**:
[github.com/brwinnov/vscode-hetzner-cloud/security/advisories/new](https://github.com/brwinnov/vscode-hetzner-cloud/security/advisories/new)

Expected response: acknowledgment within **72 hours**, fix or mitigation plan within **90 days** (faster for anything affecting API token handling).

## Security Posture

- Hetzner API tokens are stored exclusively in VS Code **SecretStorage** (OS keychain). They are never written to settings, globalState, or files, and never logged.
- Cloud-init **templates** are stored in extension globalState (unencrypted). The extension warns before saving a template that appears to contain credentials — avoid storing secrets in templates.
- All WebViews use a strict CSP (`default-src 'none'`) with per-render cryptographic nonces; all API-sourced values are HTML-escaped.
- Dependency audits run in CI on every push/PR and weekly on a schedule (`security-audit.yml`): the full tree is gated at high/critical, the runtime tree at moderate.

## Known Exceptions

None currently. (The previous `@vscode/vsce -> yauzl` moderate advisory exception was resolved by upgrading `@vscode/vsce`.)
