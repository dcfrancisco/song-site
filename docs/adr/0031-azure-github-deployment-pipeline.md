# ADR-0031: Azure Deployment from GitHub Actions

- Status: Proposed for project-owner review
- Date: 2026-09-30
- Owner: To be assigned
- Related work packages: `WP-032`, `WP-029`, `WP-018`
- Related ADRs: `ADR-0018`, `ADR-0028`, `ADR-0026`

## Context

The repository currently has a GitHub Pages workflow for the Angular frontend and local Docker Compose support for a production-like stack. It does not yet have an automated deployment path for the Express API, PostgreSQL, migrations, secrets, or full-stack smoke tests.

The target deployment platform is Azure, and deployment must be driven from GitHub Actions. PostgreSQL is not installed in the current development environment, so this ADR defines the target and gates only; it does not claim that database compatibility or deployment has been verified.

## Decision

Use GitHub Actions as the deployment orchestrator for the Azure production path.

The planned runtime topology is:

- Azure Container Registry stores versioned backend and frontend container images.
- Azure Container Apps runs the Express API and Angular frontend as separately deployable services.
- Azure Database for PostgreSQL Flexible Server provides the production database.
- GitHub Actions authenticates to Azure with a federated OIDC identity. Long-lived Azure credentials and database passwords must not be stored in the repository.
- Deployment configuration is supplied through Azure-managed environment variables and secrets. The frontend receives an explicit API base URL at build time.
- Database migrations run as an authenticated, release-owned step before the backend revision is promoted. Migration failure blocks deployment.
- Deployment uses immutable image tags tied to the Git commit and retains the previous healthy revision for rollback or forward-fix operations.

The deployment pipeline must complete the required ADR-0028 gates before promotion:

- frontend unit tests and production build;
- backend unit tests;
- PostgreSQL integration tests against the supported PostgreSQL 14+ and `pgvector` baseline;
- migration and API smoke checks;
- focused Playwright smoke tests against an isolated controlled environment.

Production deployment remains blocked until the Azure subscription, resource ownership, networking, domains, identity, backup/recovery targets, and environment model are approved.

## Consequences

Azure becomes the operational owner for the API, containers, and PostgreSQL service, while GitHub remains the source of release automation and repository governance. The deployment path gains repeatable gates, auditable releases, and a rollback target, but it requires Azure resource provisioning, OIDC setup, environment separation, migration safety, monitoring, and cost ownership.

The existing GitHub Pages workflow may remain for the static-site path until the Azure frontend deployment is implemented and accepted. It must not be treated as a full-stack production deployment.

## Implementation boundary

This ADR is documentation only. No GitHub Actions workflow, Azure resource, PostgreSQL installation, migration command, secret, or production deployment is added by this decision.

## Open questions

- Which Azure subscription, region, resource group, and cost owner will be used?
- Should the frontend use Azure Container Apps immediately or remain on GitHub Pages during a transition?
- What staging and production domains, CORS origins, and Entra application registrations are required?
- Who owns Azure access, on-call response, backups, restore testing, and rollback approval?
- Which Azure PostgreSQL tier and retention settings satisfy the approved recovery targets?
