# ADR-0037: Content Versioning and Publication Lifecycle

- Status: Accepted for implementation; lifecycle foundation in progress
- Date: 2026-10-13
- Owner: To be assigned
- Related work packages: `WP-037`, `WP-039`, `WP-040`
- Related ADRs: `ADR-0004`, `ADR-0020`, `ADR-0023`, `ADR-0025`, `ADR-0034`, `ADR-0036`

## Context

Current content mutations overwrite live SQLite or PostgreSQL rows. There is no durable draft, preview, author attribution, immutable publication history, recovery operation, or stale-write detection. A page authoring system needs lifecycle rules that work for multiple page schemas without allowing one editor to silently overwrite another editor's work.

## Decision

Store managed page content as versioned documents with shared lifecycle metadata and page-specific validated payloads.

The initial logical model is:

- `content_documents`: stable page/document key, content type, schema version, locale/audience scope, current published version reference, and lifecycle metadata;
- `content_versions`: immutable version number, document reference, state, page-specific payload, base version, author, timestamps, validation result, and optional change summary;
- `content_drafts`: the current mutable draft pointer or draft metadata when separated from immutable snapshots;
- `content_audit_events`: append-only actor, action, document, source/target version, correlation identifier, timestamp, and safe metadata; and
- `content_assets`: metadata references only, when the page uses managed media under `ADR-0025`.

SQLite may store validated payloads as text JSON and PostgreSQL as `jsonb`, but adapters must return the same typed contract and enforce the same state rules. Migration ledgers and adapter parity are prerequisites for production use.

### Lifecycle

The supported states are `draft`, `published`, `superseded`, and `discarded`. A document has at most one effective published version for each approved locale/audience scope. Publishing creates an immutable version and atomically updates the published pointer. Previously published versions become `superseded` but remain recoverable.

Restoring does not mutate or republish an old row. It creates a new draft based on the selected historical version, preserving the full chain of custody. Discarding retains enough metadata and audit history to prove who discarded which draft; retention duration requires approval under `ADR-0020`.

### Concurrency

Use optimistic concurrency through an opaque ETag or version token. Draft Save and Publish require the version last read by the editor. A stale token returns `409 Conflict` (or `412 Precondition Failed` if `If-Match` is used consistently) with the current server version metadata, without overwriting either editor's work.

The first implementation does not require pessimistic locks. A short-lived advisory edit-presence indicator may be added later, but it must not replace version checks.

### Validation and publication

Draft Save applies structural and safety validation and may allow explicitly marked incomplete fields. Publish applies the complete page schema, link/media policy, required-field rules, and cross-section invariants in one transaction. Preview uses the same rendering contract as publication but never changes the published pointer.

Audit events are recorded for draft creation, Save, validation failure where appropriate, Publish, Discard, restore, permission denial, and administrative lifecycle operations. Sensitive payloads and session/token data are not copied into audit metadata.

### Attribution and permissions

Every write records the server-resolved principal. Authors and publishers are never accepted from request payloads. Development identities are visibly marked in audit records and are forbidden in Production Mode. Permission checks happen before reading non-public drafts or history and again before state transitions.

## Implementation evidence

The SQLite and PostgreSQL migrations establish documents, immutable version snapshots, audit events, published pointers, and withdrawn org-chart archival. The announcement API implements Save, Preview, Publish, Discard, version listing, restore-to-draft, validation, and expected-version conflict handling. PostgreSQL runtime parity still requires an integration environment and is not claimed as verified by the current test run.

## Consequences

The system gains safe preview, rollback-by-new-version, attribution, conflict detection, and an auditable publication trail. Storage and APIs become more complex than direct row updates, and page adapters must migrate current published content into an initial version without changing the public layout.

Publication history and audit retention can grow indefinitely unless product, privacy, and operations owners approve retention and archival rules.

## Verification requirements

- Two editors saving from the same base version produce a deterministic conflict; neither update is silently lost.
- Draft Save, preview, Publish, Cancel, Discard, and restore have distinct tested outcomes.
- Published versions are immutable and a failed Publish leaves the previous version active.
- Restore creates a new draft and preserves the original history.
- Server-resolved actor attribution and timestamps are present for all mutations.
- SQLite and PostgreSQL enforce equivalent version and state behavior.
- Audit records are append-only through ordinary application permissions.
- Public reads cannot expose drafts, discarded versions, author-only notes, or audit metadata.

## Approval questions

- Is one active draft per page/locale/audience sufficient, or are parallel named drafts required?
- Should `If-Match` use HTTP ETags (`412`) or an explicit expected-version field (`409`)?
- How long are discarded drafts, version payloads, and audit events retained?
- Does publishing require a different person from the author?
- Are locale and audience variants required in the first release?

## Implementation boundary

This ADR documents a proposed lifecycle. It does not add tables, migrations, endpoints, audit events, or editor behavior.
