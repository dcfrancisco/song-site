# Song Site Agent Instructions

This repository is a team project. Before making changes, read [docs/ai/team-agent-contract.md](docs/ai/team-agent-contract.md) and follow it as the shared engineering contract.

Claude MUST:

- preserve unrelated worktree changes;
- use the existing Angular, Express, SQLite, OpenAPI, ADR, and work-package patterns;
- update the relevant ADR or work package when architecture or delivery status changes;
- validate the touched behavior before broadening the change;
- state any unimplemented production concerns instead of implying they are complete.

For implementation status, consult [docs/work-packages.md](docs/work-packages.md). For architecture decisions, consult [docs/README.md](docs/README.md).