# ADR-0018: Production Hosting and API Topology

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-018`, `WP-019`

## Context

GitHub Pages deploys only the Angular static frontend. The Express API, database, migrations, secrets, and operational controls require a separate runtime. The current deployment workflow does not select or deploy a backend host, configure `VITE_API_BASE_URL`, or verify an externally reachable API.

## Decision

Treat the frontend and API as separately deployable production services:

- GitHub Pages remains the static frontend host unless project owners approve a replacement.
- Express runs on an approved managed backend platform with a stable HTTPS API origin.
- PostgreSQL runs on an approved managed database service; application credentials are deployment secrets.
- Production frontend builds MUST receive an explicit `VITE_API_BASE_URL` pointing to the approved API origin.
- The API MUST define allowed frontend origins, health checks, environment separation, and request logging without sensitive payloads.
- Frontend deployment is not considered a successful full-stack release until API reachability and a browser smoke test pass.

The hosting vendor, domains, environments, budget, and on-call ownership remain open decisions for project owners.

## Consequences

Static and backend releases can be independently rolled out, but compatibility and rollback coordination are required. CORS, secrets, monitoring, and API availability become deployment concerns rather than GitHub Pages concerns.

## Review questions

- Which platform hosts Express and PostgreSQL?
- What are the development, staging, and production origins?
- Who owns production access, incident response, and cost approval?
- What API availability and recovery targets apply?
