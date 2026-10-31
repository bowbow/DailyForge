# Daily Forge

Daily Forge is a private, cross-device progressive web app that gives a user one
small, concrete daily challenge intended to improve their body, character,
community involvement, or creativity.

Canonical repository: [github.com/bowbow/DailyForge](https://github.com/bowbow/DailyForge)

The product is built around a simple loop:

> Accept a challenge, act, record progress, reflect, and remember.

Completed challenges become entries on the user's private **Wall of Goodness**.
The wall and completion streak provide evidence of positive action and encourage
the user to continue. Daily Forge is not a social network, a running coach, or a
system for assigning moral scores.

## Project status

The repository has completed its initial **product and architecture definition**
and is ready for a runnable-first implementation. Application and infrastructure
code have not yet been generated.

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

## Confirmed direction

- Installable responsive PWA for a Google Pixel 6 and desktop browsers.
- Private accounts with cross-device synchronization.
- One daily challenge drawn from Body, Character, Community, or Creativity.
- Multiple tracking modes: counter, timer, checklist, and written account.
- Self-reporting; the app does not demand proof of a good action.
- A private Wall of Goodness containing completed challenges.
- Completion streaks and lifetime totals.
- AWS deployment initially centered on one EC2 host and one durable Elastic IP.
- Terraform for infrastructure provisioning and maintenance.
- Application deployments kept separate from Terraform changes.
- TypeScript workspace using pnpm, React and Vite, Fastify, Zod, Vitest,
  Playwright, PostgreSQL, Docker Compose, and Terraform.

## Important open choices

See [the roadmap](docs/ROADMAP.md#open-product-and-technical-decisions) for the
current decision list. In particular, the final authentication method, AWS
region and domain, volunteer sources, challenge library, and database access
tooling have not yet been approved.
