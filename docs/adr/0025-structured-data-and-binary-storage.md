# ADR-0025: Structured Data and Binary Storage

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-014`, `WP-017`, `WP-026`, `WP-027`

## Context

The active Journey experience has structured JSON seed data:

- `items.json`: Journey item definitions and media references.
- `status.json`: Journey status vocabulary.

The repository also contains images, videos, and other attachments. Structured records need database ownership for shared state, authorization, querying, and auditability. Binary files have different lifecycle, delivery, backup, and performance characteristics and should not be placed in relational columns by default. The unused `src/assets/data/atcp-song.json` fixture was retired under `WP-027` and is out of scope for this decision.

The former Journey item and status records are populated into SQLite `journey_items` and `journey_statuses` by migration `004-content-data.sql`. The active Journey page calls `/api/journey/items`; it does not use JSON files as its request-time source.

## Decision

Use the relational database for structured application data and metadata. Keep binary assets outside the database for the current phase.

### Structured data

The implementation MUST:

- migrate active structured data into versioned database migrations and explicit database lifecycle operations;
- map Journey item records to the Journey domain rather than treating browser assets as the shared source of truth;
- map Journey statuses to a controlled status vocabulary and server-side transition policy;
- store media and attachment metadata with the owning record, including stable key/URI, media type, size, checksum, and lifecycle state where applicable;
- keep API response contracts independent of the physical binary storage provider.

### Binary assets

Images, videos, and attachments remain file-based during local development and the current migration phase. Production storage remains open between an approved persistent server volume and managed object storage such as an organizational cloud bucket.

A production binary-storage decision MUST account for:

- persistence across deployments and backend instances;
- private versus public access and signed URL requirements;
- upload size/type validation and malware scanning;
- access control and tenant/user scope;
- CDN and cache behavior;
- backup, retention, deletion, and legal hold requirements;
- migration path from local files to the selected provider.

Git-tracked assets may remain in the repository only when they are immutable application assets and their size, licensing, and deployment behavior are acceptable. User uploads and managed production content MUST NOT rely on a Git checkout or ephemeral application filesystem.

## Consequences

Database queries and authorization remain reliable for structured records without inflating relational storage with binary content. The system must maintain a metadata-to-file relationship and later choose a durable production provider. File paths from legacy data are migration inputs and must be converted to stable asset references before production use.

## Review questions

- Which images and videos are immutable application assets versus managed/user-uploaded files?
- Does the production platform provide persistent volumes, or is object storage required?
- Which organization-approved bucket, region, encryption, scanning, and retention policies apply?
- Should the first release support uploads, or only deploy curated assets?
