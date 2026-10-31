# Executable build plan

## Purpose

This plan turns the product roadmap into small, runnable vertical slices. Its
priorities are:

1. Put an interactable app on screen quickly.
2. Preserve architectural boundaries so temporary adapters can be replaced.
3. Keep the repository runnable at every checkpoint.
4. Support prolonged, unattended implementation within explicit safety limits.

## Delivery strategy

Do not wait for production persistence, authentication, offline synchronization,
or AWS before validating the interaction.

Build in this order:

```text
Runnable in-memory challenge loop
              ↓
Durable PostgreSQL challenge loop
              ↓
Complete local product MVP
              ↓
Offline PWA and authentication/privacy readiness
              ↓
AWS deployment
              ↓
Volunteer providers
```

Each slice should leave behind tests that make the next adapter replacement
safe.

## Milestone 1: Runnable local application

### 1A. Repository and process skeleton

- Create pnpm workspace configuration.
- Add web, API, domain, contracts, and testing packages only as needed.
- Configure TypeScript, formatting, linting, Vitest, and build scripts.
- Create a React/Vite shell with Today, Wall, History, and Settings navigation.
- Create a Fastify API with a health endpoint.
- Add one command that runs the web and API development processes.
- Document exact prerequisites and commands.

Acceptance:

- A clean checkout can install dependencies.
- One documented command starts the application.
- The Pixel-width and desktop shells render without horizontal overflow.
- Format, lint, type-check, unit-test, and build commands pass.

### 1B. First complete vertical slice

- Seed one fictional daily assignment: accumulate 20 push-ups.
- Implement pure domain types for assignment, counter progress, completion,
  streak state, and wall entry.
- Implement in-memory server repositories.
- Fetch the daily challenge from the PWA.
- Accept it and add progress in multiple increments.
- Complete at the visible target.
- Display the updated streak and private wall entry.
- Add domain tests, API integration tests, and one Playwright happy-path test.

Acceptance:

- A user can move from Today to a completed Wall entry without manual data
  editing.
- Adding 5, 7, and 8 derives 20 of 20.
- Replaying an event ID does not add it twice.
- Completion creates one wall entry and advances the streak once.
- Refreshing the page preserves server memory while the server remains running.
- The app clearly identifies its data as development-only and resettable.

Milestone 1 intentionally does not include PostgreSQL, authentication, service
workers, Push, Terraform, volunteer search, or polished visual identity.

## Milestone 2: Durable challenge loop

- Select and record the database access and migration tool.
- Add PostgreSQL through Docker Compose.
- Create migrations for the first vertical slice.
- Implement PostgreSQL adapters behind the existing repository ports.
- Preserve the in-memory adapters for fast domain and API tests.
- Add transactional completion and database integration tests.
- Document reset, migrate, seed, backup, and restore commands for local data.

Acceptance:

- The Milestone 1 behavior is unchanged.
- Data survives web, API, and database restarts.
- Replayed progress and completion commands remain idempotent.
- A failed completion transaction creates neither a partial streak update nor a
  partial wall entry.

## Milestone 3: Local product MVP

- Add timer, checklist, and written-account tracking.
- Add curated challenges across all four categories.
- Add replace and skip.
- Add optional reflection.
- Add Wall timeline and filters.
- Add current, longest, lifetime, and category summaries.
- Add preference and basic physical-safety onboarding.
- Resolve time-zone and wall-deletion behavior.

Acceptance:

- Every tracking mode has domain, API, and browser tests.
- The owner can use the application locally for seven days without database
  intervention.
- Pixel 6 and desktop layouts are usable by keyboard and screen reader.

## Milestone 4: Offline, identity, and privacy

- Select and implement production authentication.
- Enforce authorization on every user-owned object.
- Add install manifest, icons, and service-worker application-shell caching.
- Add IndexedDB cache and idempotent mutation outbox.
- Add visible pending, failed, and reconciled states.
- Add data export and permanent deletion.
- Verify logging redaction and retention behavior.
- Add optional generic Web Push reminders.

Acceptance:

- Temporary network loss does not lose or duplicate progress or reflection text.
- Cross-user access tests fail securely.
- The app is safe for a small invited-user trial.

## Milestone 5: AWS deployment

- Implement Terraform bootstrap and production roots.
- Prepare a current cost estimate and cheaper-alternative comparison before
  requesting permission to apply.
- Add AWS Budget notifications and consistent cost-allocation tags.
- Create the reviewed EC2, Elastic IP, DNS, IAM, ECR, encrypted EBS, S3 backup,
  SSM, and CloudWatch design.
- Implement a separate application deployment path.
- Configure HTTPS.
- Exercise database migration, rollback, backup, and isolated restore.

Acceptance:

- Terraform validation and reviewed plan pass.
- Infrastructure apply occurs only after explicit user authorization following
  plan and cost review.
- The deployed PWA passes the core end-to-end flow.
- A documented restore exercise succeeds.

## Milestone 6: Volunteer opportunities

- Approve sources and their terms.
- Implement the provider port and one source adapter.
- Add coarse location, availability, caching, attribution, and stale-result
  handling.
- Let signing up or completing a volunteer action become a trackable challenge.

Acceptance:

- Results are current, attributable, sanitized, and privacy-preserving.
- No unapproved scraping or disclosure of challenge history occurs.

## Prolonged-work agreement

Before an unattended run, agree on:

- The target milestone or explicitly bounded subset.
- The finish condition.
- Whether dependency installation is authorized.
- Whether local Docker services may be started.
- Whether checkpoint commits and pushes are authorized.
- Any time, cost, or tool constraints.

Within that envelope, the agent should:

1. Inspect the current repository and docs/STATUS.md.
2. Work through the milestone in dependency order.
3. Make reversible decisions without interrupting for cosmetic preferences.
4. Record meaningful assumptions and decisions.
5. Move to another in-milestone task if one task is temporarily blocked.
6. Run checks continuously rather than saving verification for the end.
7. Update docs/STATUS.md at every stable checkpoint.
8. Finish with a runnable state and an exact handoff.

The agent must stop before:

- Production or AWS mutations without explicit authorization.
- Any cost-producing cloud mutation until the user has reviewed the Terraform
  plan, expected costs, cost risks, and cheaper alternatives.
- DNS, certificates, paid services, or external-account changes.
- Creating or rotating real secrets.
- Scraping or contacting a volunteer provider.
- Destructive data or infrastructure operations.
- A product, privacy, or architectural choice that materially exceeds the agreed
  milestone.

## Checkpoint format

docs/STATUS.md should always answer:

- What milestone is active?
- What works now?
- What changed since the last checkpoint?
- What verification passed or failed?
- What assumptions were made?
- Is anything blocked?
- What is the exact next action?

If commits are authorized, prefer one coherent commit per stable vertical slice.
Do not push a knowingly broken checkpoint.

## First build run

The first prolonged build run should cover Milestone 1A and 1B. It may install
the accepted dependencies and create local application code. It should not start
PostgreSQL, implement authentication, create Terraform resources, or deploy
anything.

## Extended autonomous run 1

This continuation ladder is designed for an unattended run of up to eight hours.
Elapsed time is an operating envelope, not a promise to finish every item. The
agent continues in order while verified, in-scope work remains.

### Stage A: Runnable skeleton

- Complete Milestone 1A.
- Start the web and API together.
- Verify phone and desktop shells.
- Record canonical commands.
- Commit and push a stable checkpoint if authorized.

### Stage B: Counter challenge vertical slice

- Complete Milestone 1B.
- Verify idempotent progress and completion.
- Add API, domain, and Playwright coverage.
- Commit and push a stable checkpoint if authorized.

### Stage C: Tracking breadth

- Add timer, checklist, and written-account challenge policies using in-memory
  repositories.
- Add one fictional seeded challenge for each mode.
- Keep completion rules visible in the UI.
- Add focused domain and browser tests.

### Stage D: Daily challenge product flow

- Add curated fictional challenges across Body, Character, Community, and
  Creativity.
- Add accept, replace, and skip.
- Add optional completion reflection.
- Add current, longest, and lifetime streak presentation.
- Add wall timeline and category filtering.

### Stage E: Quality hardening

- Add empty, loading, error, and resettable-development-data states.
- Verify Pixel 6 and desktop responsive behavior.
- Improve keyboard flow, semantic HTML, focus behavior, screen-reader labels,
  contrast, and reduced-motion handling.
- Run format, lint, type-check, unit, integration, end-to-end, and production
  build checks.
- Update README, STATUS, and relevant architecture documentation.

### Stage F: Safe stretch work

Only after Stages A through E pass:

- Add an install manifest and non-branded placeholder PWA metadata.
- Add calendar/history presentation using existing in-memory data.
- Add more edge-case tests for streaks, time zones, replacements, and duplicate
  commands.
- Refactor duplication revealed by completed tests.

### Explicit exclusions

This extended run does not authorize:

- PostgreSQL or Docker repair.
- Production authentication or real user data.
- Service-worker offline mutation synchronization.
- Web Push.
- AWS, Terraform apply, deployment, DNS, or paid services.
- Volunteer-provider access or scraping.
- Creation or use of real secrets.

If all authorized stages finish early, improve tests, accessibility, error
handling, documentation, and maintainability. Do not silently begin an excluded
area.
