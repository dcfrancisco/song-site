# Azure Deployment Setup

This runbook describes the preparation required for deploying Song Site to Azure from GitHub Actions. It is a setup and release guide; it does not create Azure resources or add deployment workflows.

The target architecture is defined by [ADR-0031](../adr/0031-azure-github-deployment-pipeline.md). The related implementation work is tracked under `WP-032` and `WP-033`.

## Target topology

- **Azure Container Registry:** stores immutable frontend and backend images.
- **Azure Container Apps:** runs the Angular frontend and Express API as separate services.
- **Azure Database for PostgreSQL Flexible Server:** hosts the production database.
- **GitHub Actions:** runs verification, builds images, performs migrations, and promotes approved revisions.
- **Microsoft Entra ID:** provides frontend sign-in and, after `WP-033`, API access-token authorization.

GitHub Pages currently hosts only the static frontend. It is not a full-stack deployment because it does not host the Express API or PostgreSQL service.

## Prerequisites

Obtain approval for the following before provisioning resources:

- Azure subscription and billing owner
- Azure region and resource-group owner
- staging and production environment owners
- application/API domains and DNS ownership
- backup, retention, recovery-point, and recovery-time targets
- Entra tenant, application registrations, API permissions, and group/app-role owners
- GitHub repository administrators who can configure environments and federated credentials

Install locally only if resource provisioning is being performed from a developer workstation:

- Azure CLI
- Docker or an equivalent OCI-compatible image builder
- GitHub CLI, if repository configuration will be automated
- PostgreSQL client tools for operational checks

Do not install or configure production credentials in the repository. Use Azure Key Vault, Container Apps secrets, or GitHub environment secrets as appropriate.

## Resource plan

Use separate resource groups or clearly isolated environments for staging and production.

Recommended resource categories:

| Resource | Purpose | Required controls |
| --- | --- | --- |
| Container Registry | Store versioned images | Private access where possible; retention policy; no mutable production-only tags |
| Frontend Container App | Serve Angular through Nginx | HTTPS ingress; API base URL configured for the target environment |
| Backend Container App | Run Express API | HTTPS ingress; restricted CORS; health endpoint; managed identity where supported |
| PostgreSQL Flexible Server | Production database | Private networking where possible; TLS; backups; retention; least-privilege database user |
| Key Vault or managed secrets | Store runtime secrets | Access limited to the deployment/runtime identities; audit secret access |
| Log/monitoring resources | Observe deployment and runtime health | Alerts for failed revisions, database health, and API errors |

The exact Azure SKU, network topology, region, and resource names require owner approval.

## Entra configuration

The existing frontend already uses `@azure/msal-browser`. Create or confirm the following registrations:

1. **SPA client registration**
   - client ID for the Angular application;
   - tenant ID;
   - exact redirect URIs for local, staging, and production;
   - exact post-logout redirect URIs;
   - delegated permission to the Song Site API once the API registration exists.

2. **API registration**
   - application ID URI;
   - delegated scope such as `access_as_user`;
   - approved app roles or groups for application permissions;
   - documented audience and issuer values for backend validation.

Example environment values are placeholders only:

```text
VITE_AZURE_REDIRECT_URI=https://<frontend-domain>/
VITE_ENTRA_CLIENT_ID=<spa-application-client-id>
VITE_ENTRA_TENANT_ID=<entra-tenant-id>
VITE_API_BASE_URL=https://<api-domain>/api
```

`VITE_*` values are embedded into the frontend build and must not contain secrets. The backend must validate access tokens server-side before protected operations are enabled. Until `WP-033` is implemented, the temporary content API key is not a production identity solution.

## GitHub Actions identity

Configure a GitHub Actions federated credential in Azure using OIDC. The workflow should be restricted by:

- repository and owner;
- branch or environment;
- deployment environment name;
- audience required by the Azure login action.

Use separate GitHub environments for staging and production. Protect production with required reviewers and environment-specific variables/secrets.

The intended workflow permissions include:

```yaml
permissions:
  contents: read
  id-token: write
```

Do not use a long-lived Azure service-principal secret when OIDC federation is available.

## Required GitHub environment values

Names should be finalized with the deployment implementation, but the pipeline will need values equivalent to:

- Azure subscription and tenant identifiers;
- Azure client/application identifier for the federated deployment identity;
- resource group and Container Apps environment names;
- Container Registry name and login server;
- frontend and backend image repository names;
- staging or production API URL;
- frontend Entra redirect URI, client ID, and tenant ID;
- database connection secret or reference to an Azure-managed secret;
- migration and smoke-test configuration.

Never commit values for `DATABASE_URL`, database passwords, client secrets, signing keys, or API keys.

## Release gates

A deployment workflow must run these checks before production promotion:

```text
npm run test:ci
npm run build:ci
cd backend && npm test
```

The completed pipeline must additionally provide:

- PostgreSQL 14+ with `pgvector` integration tests;
- migration validation against the deployment database contract;
- backend API smoke checks;
- focused Playwright smoke tests against isolated data;
- container image vulnerability and configuration checks;
- health checks for the new backend and frontend revisions;
- retained logs and test artifacts for failed releases.

The frontend build must receive the target API URL at build time. A GitHub Pages `/api` fallback must not be used for an Azure deployment unless the frontend host deliberately proxies `/api` to the backend.

## Artifact retention and cleanup

Use seven days as the default retention period for ordinary deployment artifacts, test reports, deployment logs, and unreferenced container images. Configure this at the GitHub Actions artifact level and in the Azure Container Registry cleanup policy when the deployment workflow is implemented.

Do not expire or delete the following through ordinary cleanup:

- the currently deployed image digest;
- the previous healthy rollback image and revision;
- migration evidence for an active or recently promoted release;
- audit or incident records;
- PostgreSQL backups, which require a separate approved recovery-retention policy.

## Deployment order

1. Run verification and build the commit-tagged frontend and backend images.
2. Push immutable images to Azure Container Registry.
3. Confirm PostgreSQL backup and migration prerequisites.
4. Run the authenticated migration step against the target database.
5. Deploy the backend revision and wait for its health check.
6. Deploy the frontend revision with the matching API URL.
7. Run API smoke tests and focused browser checks.
8. Shift production traffic only after all checks pass.
9. Record the commit, image digests, migration result, test evidence, and operator approval.

Migration failures must block promotion. Do not make destructive schema changes without a tested rollback or forward-fix plan.

## Rollback and recovery

- Keep the previous healthy Container Apps revisions available until the release is accepted.
- Roll back application traffic to the previous compatible revision when the issue is application-only.
- Prefer a forward fix for migrations that are not safely reversible.
- Restore PostgreSQL only through the approved backup and recovery procedure.
- Record the failed commit, image digests, migration state, operator, and recovery action.
- Re-run API and browser smoke checks after recovery.

## Current status

This runbook is planning documentation only. Azure resources, GitHub OIDC configuration, deployment workflows, PostgreSQL production provisioning, and Entra API-token validation are not yet implemented. PostgreSQL is not installed in the current local environment.
