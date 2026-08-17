# Changelog

All notable changes to Hetzner Cloud Toolkit are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.5.0] - 2026-08-17

### Fixed
- **`hcloud.addSubnet` and `hcloud.refreshImages` were contributed but never registered** — the Images view's refresh button and the Add Subnet action (tree context menu and network detail panel) threw *"command not found"*. Both now work; `addSubnet` accepts a tree item or detail-panel context and falls back to the network picker
- Firewall rule deletion removed **every** rule matching direction/protocol/port/IPs — rules identical except description were all deleted together. Deletion is now index-based and removes exactly one rule
- IPv6-only servers could never SSH: Hetzner reports IPv6 as a /64 prefix, which failed IP validation. The conventional `::1` host address is now derived for SSH and display
- Running tree-item commands (delete server/network/volume, SSH, etc.) from the Command Palette crashed with a TypeError — they are now hidden from the palette
- Server creation wizard: "Create Server" button is disabled immediately on click (double-clicks could create two billed servers); re-enabled on error
- Server creation wizard: image cards with a null name and description no longer break rendering; snapshot selection highlight survives search/filter re-renders; duplicate event listeners no longer accumulate on filter/search interaction
- SSH key upload: file-read errors are now caught; manual-entry flow no longer pre-fills the key name with the literal picker label
- Volume size inputs strictly validate whole numbers (previously `10abc` was accepted as 10)
- Missing error handling added to create/delete network, add SSH key, and server start/stop/reboot/delete commands
- Adding a project with an existing name now warns before overwriting the stored token
- `app`-type images are now fetched and shown in the Images view
- CHANGELOG: added missing `[0.4.3]` link definition; note: versions 0.4.0–0.4.2 were internal iterations that were never published

### Security
- Cloud-init templates: saving a template that appears to contain credentials (Tailscale keys, private keys, passwords, API tokens) now warns that template storage is unencrypted
- Server wizard: `hcloud.defaultRegion` setting is now base64-transported into the WebView like all other bootstrap data (a malicious workspace `.vscode/settings.json` could previously inject markup via a crafted region string)
- WebView hardening: `getImages()` API parameter is URI-encoded; network detail panel gained charset/lang and CSP-consistent script placement; wizard loading/error pages gained CSP meta tags; removed a `console.log` postMessage fallback that could echo cloud-init content; volumes tooltip no longer sets `isTrusted`
- Firewall rule CIDR input now strictly validates IPv4/IPv6 CIDR (previously `abc` or `1.2.3.4/999` passed)
- IP validation now uses Node's `net.isIP` (fixes IPv6 edge cases such as `1::2::3` being accepted)
- SSH key guide: SSH config recipe now uses `StrictHostKeyChecking accept-new` instead of `no`
- SECURITY.md: vulnerability reports now go through GitHub Private Vulnerability Reporting instead of public issues; added supported-versions table and response SLA

### Changed
- All tree view disposables are now registered in `context.subscriptions`
- Toolchain modernised: TypeScript 5.9, ESLint 10 (flat config), typescript-eslint 8, esbuild 0.28.2, @vscode/vsce 3.9, @vscode/test-electron 3.1, prettier 3.9; ESLint 8 and @typescript-eslint 7 (both EOL) removed
- Minimum VS Code version raised from 1.85 to **1.100**; `@types/vscode` pinned to match
- `package.json`: removed misleading `publishConfig` (GitHub Packages npm registry), added `"private": true`; expanded marketplace keywords; dependency `overrides` re-baselined (only `serialize-javascript` and `diff` still required, for mocha's nested dependencies — full and runtime `npm audit` both clean)
- esbuild: added `target: node20`; build warnings no longer suppressed
- `tsconfig.json`: `noEmit` (bundling is esbuild's job — prevents stray `tsc` output landing in `dist/`)
- `.vscodeignore`: now excludes `.github`, `archive`, all `*.map` files, lint/format configs, agent instruction files (`AGENTS.md`) and `*.code-workspace` from the VSIX
- CI: new `ci.yml` (lint, build, tests under xvfb, VSIX package check on every push/PR) and `release.yml` (tag-triggered: a `build` job lints/typechecks/tests/packages with no secret access, then a `publish` job gated on the `marketplace-publish` environment (required reviewer, deployments restricted to `v*` tags) uploads that exact VSIX to the Marketplace and attaches it to a GitHub Release; the tag must match `package.json`'s version or the run fails before doing any work); security audit now also runs weekly and gates the runtime tree at moderate level. Removed the stale `publish-extension.disabled.yml` — despite the name, GitHub dispatches workflows by file extension, so it still triggered on `v*` tags and would have raced `release.yml` into a duplicate publish

---
## [0.4.6] - 2026-06-28

> Note: v0.4.5 below was never published to the Marketplace. Its changes are
> included in this release alongside the additional fixes below.

### Security
- Crypto-secure CSP nonce generation across all WebViews (carried over from the unpublished 0.4.5 work)
- Consistent HTML-escaping in the server creation wizard
- Project index storage hardened against project names containing special characters (including commas)
- SSH terminal launch now validates the server's IP address before connecting

### Added
- Automated regression test coverage for project-index storage, IP validation, and nonce generation

### Fixed
- Packaging: the VSIX no longer includes unbundled source files, test output, or internal build/dev configuration — package size reduced accordingly

---

## [0.4.5] - 2026-06-28

### Changed
- Security maintenance release: forced dependency remediation applied (`npm audit fix --force`) and toolchain dependency `esbuild` updated to `^0.28.1`
- Release process hardening: validated clean audit baseline for both full dependency tree and runtime-only tree (`npm audit` and `npm audit --omit=dev`)
- WebView security hardening: moved all CSP script nonces to cryptographically secure generation and aligned server creation wizard rendering with consistent HTML escaping for location and server-type data

### Verified
- Lint, production build, and VSIX packaging completed successfully on the refreshed dependency set

---

## [0.4.4] - 2026-03-14

### Changed
- Release packaging: published next VSIX build after security hardening and audit-gate updates

---

## [0.4.3] - 2026-03-14

### Fixed
- Security: hardened `serverWizard` WebView bootstrap data transport to avoid script-break injection from untrusted API values by decoding base64 JSON at runtime
- Security: upgraded and pinned vulnerable dependencies to remove all high-severity `npm audit` findings (remaining advisories are moderate in packaging toolchain)
- Lint and type-safety cleanup across API and WebViews (`any` reductions, const usage, and minor regex cleanup)

### Added
- Security governance: `SECURITY.md` policy with documented temporary exception for `@vscode/vsce -> yauzl` moderate advisory (no upstream fix available)
- CI guardrail: GitHub Actions workflow `security-audit.yml` to fail on high/critical vulnerabilities only

---

## [0.3.1] - 2026-03-12

### Fixed
- Security: escape Robot API error messages before rendering in `robotCredentialsPanel` WebView to prevent DOM-based XSS via malicious or MitM'd API responses

---

## [0.3.0] - 2026-03-10

### Added
- **Networks guide WebView** — $(info) toolbar button opens a guide covering private network concepts, order of operations (network → subnet → attach server), and four real-world subnet layout examples
- **Firewalls guide WebView** — covers rule directions, protocols (TCP/UDP/ICMP/ESP/GRE), port syntax, default rule set, and five use-case rule tables (web server, private DB, game/UDP, Tailscale, locked-down egress)
- **Volumes guide WebView** — overview cards (size range, formats, location constraint), all five actions explained (create/attach/detach/resize/delete), filesystem resize commands, and five use cases
- **Images guide WebView** — tabbed page: Overview tab lists all four image types and available system OS images; Custom Images tab has a seven-step snapshot workflow guide plus cloud-init alternative and best-practice callouts
- **Robot API credentials WebView form** — replaces sequential `showInputBox` prompts with a persistent two-field form (username + password) that stays open while switching to a password manager; shows inline spinner and validation status without closing

### Changed
- `hcloud.setRobotCredentials` command now opens a WebView credentials form instead of VS Code input boxes
- Toolbar icon order standardised across all panels: **info → add → refresh**; fixed SSH Keys (was add → info → refresh) and Networks (refresh was before addSubnet)

---

## [0.2.9] - 2026-03-10

### Fixed
- README: corrected marketplace publisher ID from `brwinnov` to `brwinnovvsce` in all badge and install URLs
- README: added all features missing since v0.2.1 (Firewalls, Volumes, Load Balancers, Storage Boxes, Server Detail panel, status polling, cloud-init library)
- `package.json`: corrected repository URL format for vsce image resolution
- `tsconfig.json`: replaced stale `codereview` exclude with `scripts`
- TypeScript: fixed three pre-existing strict-mode errors (`hetzner.ts` TS7022, `secretStorage.ts` TS2835, `serverWizard.ts` TS2352)

### Changed
- Repo housekeeping: removed stale tracked files (`.aivory`, `verdict01.md`, `wiki/`, dangling `wiki-repo` submodule)
- `.gitignore` / `.vscodeignore`: updated to reflect current project structure

---

## [0.2.8] - 2026-03-10

### Fixed
- Load Balancer: remove-target confirmation now shows server name instead of numeric ID
- Load Balancer: add-target picker annotates servers in a different location with a warning
- Server Detail: all error catch handlers now use safe `unknown` type instead of `any`
- Server Detail: delete button danger styling now uses VS Code theme CSS variables (light theme support)

---

## [0.2.7] - 2026-03-10

### Changed
- Updated README with cleaner install links and marketplace badges

---

## [0.2.6] - 2026-03-09

### Changed
- Version bump for CI/publish pipeline maintenance

---

## [0.2.5] - 2026-03-09

### Fixed
- VSCE-PAT token roles updated for VS Marketplace publishing

---

## [0.2.4] - 2026-03-09

### Fixed
- Updated publisher ID to `brwinnovvsce` to match VS Marketplace account

---

## [0.2.3] - 2026-03-09

### Fixed
- CI: use Node 20 and `@vscode/vsce` for publish workflow

---

## [0.2.2] - 2026-03-09

### Fixed
- CI: publisher and GitHub Actions configuration for VS Marketplace publishing

---

## [0.2.1] - 2026-03-09

### Added
- **Load Balancers panel** — create, delete, add/remove server targets; type and algorithm selection
- **Storage Boxes panel** — Hetzner Robot storage box list, mount via cloud-init, copy CIFS mount commands
- Firewall commands — create with default or empty rule set, add/delete rules, apply/remove from servers
  - Tailscale UDP 41641 rule offered automatically when a Tailscale key is configured
- Volume commands — create (live location list from API), attach/detach, resize, delete
- Server Detail WebView — specs, network info, labels, in-panel power/reboot/delete, SSH terminal launch
- Server status polling — transient states (starting, stopping, rebuilding) auto-refresh the Servers tree
- Cloud-init template library — save, load, delete reusable templates (stored in extension global state)
- `refreshAll` extended to cover Firewalls, Volumes, and Load Balancers on project switch
- Network Detail WebView panel — view subnets, attached servers, inline subnet delete

### Fixed
- `deleteFirewallRule` now matches rules by content rather than cached array index (multi-client safe)
- Inline network creation in wizard no longer discards wizard form state
- Cloud-init library migrated from SecretStorage to `context.globalState` (removes keychain size limits)
- Server Detail status badge colors use VS Code theme CSS variables (dark and light theme support)
- HTML escaping added for all API-sourced values in Server Detail WebView

---

## [0.2.0] - 2026-03-09

### Added
- Enhanced Networks tree view: subnet count, improved tooltips, inline add-subnet action
- 'Add Subnet to Network' command with network picker
- 'Show Network Details' command

---

## [0.1.1] - 2026-03-03

### Fixed
- README formatting: left-aligned install links for cleaner presentation
- Improved `.vscodeignore` to exclude development files from package

### Added
- Welcome page link in Setup section for easy re-access
- Cloud Console placeholder (Coming Soon) in Setup section

---

## [0.1.0] - 2026-03-02

### Added
- **SERVERS panel** — live server list with status icons; power on / off / reboot / delete context menu actions
- **NETWORKS panel** — private network list; create and delete networks
- **IMAGES panel** — browse available OS images for the active project/region
- **SSH KEYS panel** — view, add (from `~/.ssh/*.pub`), and delete SSH keys
- **7-step server creation wizard** — Basics, Server Type, OS Image, SSH Keys, Network, Cloud-init, Review
  - Tailscale auto-install toggle with auth key injection into cloud-init
  - Inline network creation without leaving the wizard
  - Root password shown in-editor after creation when no SSH key is selected
- **SSH Key Generation Guide** — tabbed WebView covering Windows, macOS, WSL, Linux/RHEL
- **Tailscale auth key manager** — stored in SecretStorage; injected as `runcmd` cloud-init block
- **Status bar item** — shows active project name; click to switch
- **First-use onboarding** — SSH key guide prompt on first project add; Welcome page on install

[Unreleased]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.4.6...v0.5.0
[0.4.6]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.4.4...v0.4.6
[0.4.5]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.3.1...v0.4.3
[0.3.1]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.9...v0.3.0
[0.2.9]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/brwinnov/vscode-hetzner-cloud/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/brwinnov/vscode-hetzner-cloud/releases/tag/v0.1.0
