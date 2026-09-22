# ADR-0020: Data Protection and Retention

- Status: Proposed for project-owner review
- Date: 2026-09-18
- Owner: To be assigned
- Related work packages: `WP-014`, `WP-016`, `WP-021`

## Context

The candidate domain includes employee identity, profile, contact, skills, competency, compliance, asset, Journey, and audit data. The current inventory does not classify these data, define retention, or specify which administrators may view or export them.

## Decision

Before production persistence of user or employee data, project owners MUST approve a data classification and lifecycle policy covering:

- fields collected, purpose, lawful/business basis, and data owner;
- visibility by subject, lead, administrator, and content manager;
- retention and deletion periods for active records, inactive users, status history, and audit events;
- correction, export, deactivation, and deletion workflows;
- encryption in transit and at rest, secret handling, backups, and restore access;
- redaction rules for logs, errors, analytics, and support tooling;
- data residency and third-party processor constraints.

User-owned records MUST have explicit subject or team scope. Audit records MUST be append-only and protected from ordinary administrator deletion. The implementation MUST not add sensitive fields solely because they appear in legacy JSON or UI fixtures.

## Consequences

The data model and admin API become narrower and easier to authorize, but schema design and migration cannot be finalized until owners approve classification and retention. Privacy and security review become release gates for new employee-data features.

## Review questions

- Which fields are required for the first release?
- What retention and deletion rules apply to Journey and contact data?
- Which roles may view, edit, export, or delete each data class?
- What regulatory, contractual, or residency requirements apply?
