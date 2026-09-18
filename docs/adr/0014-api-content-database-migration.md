# ADR-0014: Existing API Content Backed by SQLite

- Status: Accepted and implemented for the current local API
- Date: 2026-09-18
- Owner: `danny.c.francisco`

## Context

The task and training APIs already used SQLite, but the live leadership, home, and song-link APIs still read JSON files on every request. That left the site with two runtime data paths and made database-backed local development incomplete.

## Decision

Move the existing read APIs to SQLite while preserving their response shapes and compatibility URLs:

- `GET /api/leadership` reads `leadership_sections`.
- `GET /api/home/spotlight` reads `home_spotlight` and `home_spotlight_people`.
- `GET /api/home/announcements` reads `announcements`.
- `GET /api/song-links` reads `song_link_sections` and `song_link_cards`.

Migration `002-content.sql` creates the tables. The existing JSON files remain seed inputs and are not runtime sources. Complex nested content is kept as JSON payloads inside the compatibility tables so the current frontend can migrate without a response-shape change; normalization is a follow-up under `WP-014`.

## Consequences

All current read APIs use the local database and are covered by the same migration and seed lifecycle as task data. Content management writes, authentication/RBAC, PostgreSQL support, and normalized production content tables remain pending. The compatibility APIs stay under `/api/*`; new versioned APIs belong under `/api/v1`.

## Verification

- Database repository checks return the seeded leadership, spotlight, announcement, and link counts.
- HTTP smoke tests return the existing response shapes for all four content endpoints.
- JSON files are no longer read by the request handlers.