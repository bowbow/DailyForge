# 0004 — Keep the Wall of Goodness private

- Status: Accepted
- Date: 2026-10-30

## Context

The wall exists to encourage the user to complete more challenges and to remind
them of the good they have already done. Public sharing, likes, and comparison
could turn service into performance and expose private information about both
the user and people they encounter.

## Decision

The Wall of Goodness is private by default and is not a social feed.

It stores completed challenge snapshots and optional reflections. The product
will not include followers, likes, public rankings, leaderboards, or automatic
sharing. If deliberate export or sharing of an individual entry is considered
later, it requires a separate privacy review and decision.

## Consequences

- Product incentives remain centered on action, reflection, memory, and personal
  consistency.
- Wall and reflection data must be treated as sensitive content.
- Analytics and logs cannot ingest wall text.
- Growth mechanisms based on social engagement are intentionally unavailable.
- The product can still show private totals, streaks, category summaries, and
  resurfaced memories.

## Alternatives considered

### Public or friends-only feed

May increase engagement but creates performance pressure, moderation needs, and
privacy risks that conflict with the purpose of the wall.

### Share by default with an opt-out

Rejected because consent for personal reflections and stories about other people
must be explicit, narrow, and informed.
