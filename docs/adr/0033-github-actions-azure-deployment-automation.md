# ADR-0033: GitHub Actions Azure Deployment Automation

- Status: Proposed for project-owner review
- Date: 2026-09-30
- Owner: To be assigned
- Related work packages: `WP-034`, `WP-032`, `WP-029`
- Related ADRs: `ADR-0028`, `ADR-0031`, `ADR-0032`

## Context

ADR-0031 selects GitHub Actions as the deployment orchestrator for the Azure runtime. The repository currently has only a GitHub Pages deployment workflow for the Angular frontend. It does not yet automate container publishing, PostgreSQL migrations, Azure API/frontend deployment, traffic promotion, or post-deployment verification.

The pipeline must support repeatable releases without storing long-lived Azure credentials, database passwords, Entra client secrets, or API keys in the repository. It must also prevent an application deployment from being promoted when the PostgreSQL compatibility, migration, API, or browser checks required by ADR-0028 fail.

## Decision

Implement Azure deployment as a staged GitHub Actions workflow using protected GitHub environments and Azure OIDC federation.

The planned stages are:

1. **Verify:** run frontend unit tests, frontend production build, backend tests, PostgreSQL integration tests, migration checks, and focused Playwright smoke tests where the required services are available.
2. **Build:** build immutable frontend and backend container images tagged with the commit SHA.
3. **Publish:** authenticate to Azure using OIDC and push images to Azure Container Registry.
4. **Migrate:** run the release-approved database migration against the target PostgreSQL environment using a secret reference, with failure blocking deployment.
5. **Deploy:** update the backend and frontend Azure Container Apps revisions with the matching image digests and environment-specific configuration.
6. **Smoke test:** verify health endpoints, API reachability, representative API behavior, and focused browser workflows.
7. **Promote:** require protected-environment approval for production traffic and retain the previous healthy revision for rollback or forward fix.

Use separate GitHub Actions workflows or clearly separated jobs for pull-request verification, staging deployment, and production deployment. Production jobs must require a protected environment and must not run automatically from unreviewed pull requests.

The workflow must use:

- `permissions: contents: read` and `id-token: write` for Azure federation;
- repository, branch, and environment restrictions on the Azure federated credential;
- GitHub environment variables for non-secret deployment identifiers;
- Azure Key Vault, managed identity, or protected environment secrets for runtime credentials;
- commit-linked image tags and recorded image digests;
- retained test artifacts, migration output, deployment logs, and smoke-test results for failed releases.

Use a default seven-day retention period for pipeline artifacts, deployment logs, test reports, and unreferenced container images. The currently deployed image, the previous rollback image, active migration evidence, audit records, and database backups are exempt from ordinary artifact cleanup and follow their own retention policies.

## Consequences

Releases become auditable and repeatable, and Azure credentials do not need to be stored as long-lived GitHub secrets. The pipeline becomes dependent on protected environment ownership, Azure resource readiness, PostgreSQL migration safety, test isolation, and reliable health checks.

A failed migration or smoke test blocks promotion. Application rollback and database rollback are separate concerns; migrations must use a compatible expand/contract or forward-fix strategy rather than assuming that every schema change can be reversed automatically.

The existing GitHub Pages workflow may remain during transition, but it must not be presented as the Azure full-stack deployment pipeline.

## Implementation boundary

This ADR is documentation only. No GitHub Actions workflow, Azure federated credential, Container Registry, Container Apps resource, database migration command, secret, or production deployment is added by this decision.

## Completion criteria

- Pull-request verification and protected staging/production environments are defined.
- Azure OIDC login succeeds without long-lived Azure credentials.
- Images are built, scanned as required, pushed, and deployed by immutable commit reference.
- PostgreSQL migration execution is authenticated, observable, and promotion-blocking.
- API and browser smoke checks run after deployment.
- Production approval, revision rollback, migration forward-fix, and failure-artifact procedures are documented and tested.
- Automated cleanup expires ordinary pipeline artifacts after seven days without removing active or rollback-critical release evidence.
