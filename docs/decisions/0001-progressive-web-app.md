# 0001 — Build an installable progressive web app

- Status: Accepted
- Date: 2026-10-30

## Context

Daily Forge must work on a Google Pixel 6 and on a desktop. Its primary
interactions are challenge cards, counters, timers, forms, history, and a private
timeline. It does not currently require Health Connect, continuous sensors,
native widgets, or an app-store release.

Native Kotlin Multiplatform and a responsive website were considered.

## Decision

Build Daily Forge as a responsive installable PWA backed by an authenticated
server API.

The same application will be accessed from mobile and desktop browsers. It will
support basic offline reading and queued progress recording. Server-sent Web
Push, rather than exact browser periodic execution, will be used for optional
daily reminders.

## Consequences

- One primary user interface serves phone and desktop.
- Application updates are deployed centrally.
- The Wall of Goodness can synchronize naturally across devices.
- HTTPS and a server become required.
- Sensitive reflections require server-side privacy and security controls.
- Browser background scheduling is less dependable than native Android work.
- Deep Android integration would require a later native companion or a revised
  decision.

## Alternatives considered

### Kotlin Multiplatform and Compose Multiplatform

Offers stronger Android integration, native packaging, and reliable on-device
background work, but requires separate application distribution and still needs
a backend for cross-device wall synchronization and volunteer-provider access.

### Conventional non-installable website

Simpler, but omits useful application-shell caching, home-screen installation,
offline behavior, and Push integration.
