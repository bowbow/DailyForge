# Daily Forge

Daily Forge is a private, cross-device progressive web app that gives a user a
small set of concrete daily challenges intended to improve their body,
character, community involvement, and creativity.

Canonical repository: [github.com/bowbow/DailyForge](https://github.com/bowbow/DailyForge)

The product is built around a simple loop:

> Choose a challenge, act, record progress, reflect, and remember.

Completed challenges become entries on the user's private **Wall of Goodness**.
The wall and completion streak provide evidence of positive action and encourage
the user to continue. Daily Forge is not a social network, a running coach, or a
system for assigning moral scores.

## Project status

The repository now contains a runnable local vertical slice. The React PWA and
Fastify API support accepting, replacing, tracking, and completing a challenge,
then recording it on a private Wall of Goodness. Data is intentionally in memory
until the durable-storage milestone. See [current build status](docs/STATUS.md)
for exact capabilities and constraints.

## Start here

Read these documents in order:

1. [Product specification](docs/PRODUCT.md)
2. [Experience and interaction design](docs/UX.md)
3. [Application architecture](docs/ARCHITECTURE.md)
4. [Domain model](docs/DOMAIN_MODEL.md)
5. [Security and privacy](docs/SECURITY_PRIVACY.md)
6. [AWS and Terraform design](docs/INFRASTRUCTURE.md)
7. [Executable build plan](docs/BUILD_PLAN.md)
8. [Current build status](docs/STATUS.md)
9. [Implementation roadmap](docs/ROADMAP.md)
10. [Architecture decision records](docs/decisions/README.md)

Instructions for coding agents are in [AGENTS.md](AGENTS.md).

Supporting product research:

- [Body challenge research for healthy ageing](docs/Body_research.md)
- [Character challenge research and Stoic practice framework](docs/Character_research.md)
- [Creativity challenge research and program framework](docs/Creativity_research.md)
- [Creativity Program v0.1](docs/Creativity_program.md)

## Confirmed direction

- Installable responsive PWA for a Google Pixel 6 and desktop browsers.
- Private accounts with cross-device synchronization.
- Up to one daily challenge in each of Body, Character, Community, and
  Creativity. Each area is optional and progresses independently.
- Multiple tracking modes: counter, timer, checklist, and one-time confirmation
  with an optional private reflection.
- Self-reporting; the app does not demand proof of a good action.
- A private Wall of Goodness containing completed challenges.
- Completion streaks and lifetime totals.
- AWS deployment initially centered on one EC2 host and one durable Elastic IP.
- Terraform for infrastructure provisioning and maintenance.
- Application deployments kept separate from Terraform changes.
- No generative AI in the application runtime; AI may assist development and
  separately initiated, reviewed offline analysis under ADR 0006.
- TypeScript workspace using pnpm, React and Vite, Fastify, Zod, Vitest,
  Playwright, PostgreSQL, Docker Compose, and Terraform.

## Local development

Prerequisites:

- Node.js 24 or newer.
- pnpm 11.25 or a compatible version selected by the packageManager field.

Install and run:

```powershell
pnpm install
pnpm dev
```

The local application is available at http://127.0.0.1:5173 and proxies API
requests to http://127.0.0.1:3000.

Quality commands:

```powershell
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm check
```

`pnpm test:e2e` runs the core flows and an automated WCAG accessibility scan in
desktop Chromium and a Pixel 6-sized mobile browser profile. Install the
Playwright Chromium runtime once with:

```powershell
pnpm --filter @daily-forge/web exec playwright install chromium
```

The current development data is in memory. It includes fictional historical
completions and quiet days so the Wall and History views are useful during UI
development, and it resets when the API process restarts.

## Important open choices

See [the roadmap](docs/ROADMAP.md#open-product-and-technical-decisions) for the
current decision list. In particular, the final authentication method, AWS
region and domain, volunteer sources, challenge library, and database access
tooling have not yet been approved.
