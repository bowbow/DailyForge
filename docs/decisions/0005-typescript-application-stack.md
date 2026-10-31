# 0005 — Adopt the initial TypeScript application stack

- Status: Accepted
- Date: 2026-10-30

## Context

The first implementation should become runnable quickly while preserving the
shared-domain and PWA decisions. Using one language across the browser, API,
worker, contracts, and domain reduces setup and context switching. The
repository also needs fast feedback through unit, integration, and responsive
browser tests.

## Decision

Adopt this initial stack:

- pnpm workspaces for the monorepo.
- TypeScript for the web, API, worker, domain, and contracts.
- React with Vite for the PWA.
- Fastify for the HTTP API and worker-compatible server code.
- Zod for validating API commands and responses.
- PostgreSQL as the production-shaped durable store.
- Vitest for domain and integration tests.
- Playwright for end-to-end and responsive browser tests.
- Docker Compose for local infrastructure.
- Terraform for AWS infrastructure.

Pin compatible versions in the lockfile when scaffolding begins. Select the
database query/migration library and authentication system through later
decisions when those boundaries are implemented.

## Consequences

- The PWA and server can import the same pure domain package.
- Most contributors and agents need one language toolchain.
- Vite can produce static PWA assets independently of the API deployment.
- Node and browser boundaries still require separate adapters.
- A workspace and build configuration must prevent server-only code from
  entering browser bundles.
- PostgreSQL and authentication do not block the first in-memory runnable slice.

## Alternatives considered

### Kotlin Multiplatform

Strong for native Android and desktop applications, but the accepted delivery
target is now a PWA.

### Next.js full-stack application

Could reduce initial project count, but couples frontend rendering and server
deployment more tightly than needed for a static PWA plus independently
deployable API.

### Separate frontend and backend languages

May provide framework-specific advantages but increases setup, duplicated
contracts, and context switching before the product loop is validated.
