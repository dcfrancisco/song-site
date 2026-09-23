# Song Site Copilot Instructions

Follow the shared team contract in [docs/ai/team-agent-contract.md](../docs/ai/team-agent-contract.md). It is the source of truth for Claude, GitHub Copilot, and other coding agents working in this repository.

Copilot MUST:

- preserve unrelated user changes and avoid destructive Git operations;
- follow OWASP secure-coding guidance and SonarQube quality rules for every generated or edited code, test, script, infrastructure, and configuration file;
- treat security and quality findings as defects to fix or narrowly document, never silently suppress them;
- inspect the nearest owning code path before editing;
- keep API changes OpenAPI-first and database changes migration-backed;
- enforce authorization on the backend, not only through Angular navigation;
- run a focused validation immediately after each substantive edit;
- keep ADR status, implementation status, and work-package status distinct;
- never expose `.env` values, credentials, tokens, or identity secrets.

Use [docs/work-packages.md](../docs/work-packages.md) for current ownership and status, and [docs/README.md](../docs/README.md) for the ADR index.
