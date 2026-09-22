# ADR-0024: Legacy JSON Data and Database Source of Truth

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-006`, `WP-011`, `WP-014`, `WP-017`, `WP-025`

## Context

The repository historically contained legacy JSON data files that originally served as application data sources:

- former `backend/seed-data/tasks.json`
- former `backend/seed-data/training-tasks.json`
- former `backend/seed-data/song-links.json`
- former `backend/seed-data/home.json`
- former `backend/seed-data/leadership.json`

The current local backend has promoted these records into a versioned SQL migration. API requests read database tables and no longer require JSON files at startup. The migration is the local bootstrap source; future production changes must use authorized APIs or explicit migrations.

## Decision

The relational database is the runtime source of truth for application data. The listed JSON files were migration inputs only and are no longer runtime dependencies. Database initialization MUST NOT read JSON files.

The migration boundary is:

| Legacy input | Database destination |
| --- | --- |
| `tasks.json` | `tasks` |
| `training-tasks.json` | `training_tasks` |
| `song-links.json` | `song_link_sections`, `song_link_cards` |
| `home.json` spotlight | `home_spotlight`, `home_spotlight_people` |
| `home.json` announcements | `announcements` |
| `leadership.json` | `leadership_sections` |

The implementation MUST:

- keep schema changes in versioned migrations;
- make migration application and any future import separately executable and observable;
- record whether a seed or import has been applied and from which source version;
- define whether imports are insert-only, upsert, or replacement operations;
- prevent silent overwrites of database changes when seed files are rerun;
- provide a documented export or backup path before destructive replacement;
- run the same logical import strategy against SQLite and PostgreSQL;
- preserve API response compatibility during migration or introduce a versioned API change;
- treat content-management writes as database writes subject to authentication, authorization, validation, and audit requirements.

Changing a removed or historical JSON fixture MUST NOT be treated as a production content update. Production data changes require an approved migration or authorized content-management workflow.

## Consequences

The application gains a clear source of truth and can support shared, durable state. Local setup applies versioned migrations, and data changes need migration or API discipline. JSON files are no longer required for local bootstrap or runtime content.

PostgreSQL support remains incomplete until the adapter, migrations, import behavior, backup, and verification are implemented under `WP-017`.

## Review questions

- Migration `004-content-data.sql` is the current local content baseline; future import policy remains open for review.
- What source version or checksum identifies an import?
- Should future imports be insert-only, upsert, or reset-and-replace?
- Which data requires a migration rather than a seed update?
- Who approves production content changes before an admin CMS exists?
