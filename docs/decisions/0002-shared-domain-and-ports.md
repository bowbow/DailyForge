# 0002 — Use a shared pure domain with ports and adapters

- Status: Accepted
- Date: 2026-10-30

## Context

Challenge progress, completion, streaks, and wall-entry creation must behave
consistently online, offline, on the server, and in browser previews. At the same
time, the product should not become coupled to React, a particular database,
AWS, or volunteer-provider response formats.

## Decision

Keep domain rules in a pure TypeScript package and organize application
capabilities using ports and adapters.

Share the domain package between the PWA and server. The browser uses it for
immediate UX; the authenticated server remains authoritative for durable state.
Represent tracking as immutable, idempotent progress events and perform
completion, streak advancement, and wall-entry creation transactionally.

## Consequences

- Core rules can be unit-tested without a browser or database.
- The client and server can calculate consistent progress.
- Persistence, notification, and volunteer providers remain replaceable.
- API mutations need stable command/event IDs and replay handling.
- Developers must maintain strict dependency direction.
- Some types may appear in both domain and API contracts and require deliberate
  mapping rather than framework leakage.

## Alternatives considered

### Put all rules in API controllers

Fast initially, but difficult to test, reuse offline, or separate from the HTTP
framework.

### Trust the client as authoritative

Simplifies the server but makes cross-device reconciliation, security, and
idempotent streak handling unreliable.

### CRUD tables with a completed flag

Does not preserve incremental tracking or support robust offline replay.
