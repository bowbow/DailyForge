# Implementation roadmap

The roadmap favors a runnable vertical slice over building foundations in
isolation. The detailed execution and unattended-work protocol are in
[BUILD_PLAN.md](BUILD_PLAN.md).

## Phase 0: Minimum repository foundation

- Use the accepted stack in ADR 0005.
- Select and lock compatible dependency versions.
- Add formatting, linting, type checking, test, and dependency-update workflows.
- Add Git ignore rules for application, private data, and Terraform artifacts.
- Create local environment documentation.

Exit condition: one documented command starts the web and API development
processes, even before the product slice is complete.

## Phase 1: Runnable challenge slice

- Responsive PWA shell with Today, Areas, Wall, History, and Settings
  destinations.
- API health endpoint.
- One fictional user in local development only.
- Shared domain package imported by both web and API.
- One seeded push-up counter challenge.
- In-memory assignment, progress, completion, streak, and wall adapters.
- Automated domain and core-flow tests.

Exit condition: start the app locally, record increments, complete the challenge,
and see the resulting wall entry. A restart may reset data at this phase.

## Phase 2: Durable product core

- PostgreSQL development service and migration runner.
- Durable repositories replacing in-memory adapters without changing domain
  behavior.
- Reload and restart persistence.
- Idempotent progress and completion commands.

Exit condition: the Phase 1 flow survives browser and server restarts and cannot
double-count a replayed progress event.

## Phase 3: Product MVP

- Versioned challenge catalog and four categories.
- Up to one independently actionable daily assignment per category, with area
  goals and boundaries visible to the user.
- Counter, timer, checklist, and written-account tracking.
- Accept, replace, skip, and complete.
- Transactional completion and wall-entry creation.
- Current, longest, and lifetime streak data.
- Preference and safety onboarding.
- Private wall timeline and filters.
- Authentication decision implemented.
- Domain and API edge-case tests.

Exit condition: the owner can use the app for seven consecutive days without
manual database intervention.

## Phase 4: PWA resilience

- Install manifest and icons.
- Service-worker application-shell caching.
- IndexedDB read cache and mutation outbox.
- Idempotent progress commands.
- Visible pending/failed synchronization.
- Offline and reconnection end-to-end tests.
- Optional Web Push reminder.

Exit condition: progress recorded during temporary network loss synchronizes
once, without duplication or lost reflection text.

## Phase 5: AWS infrastructure

- Terraform state bootstrap.
- Production VPC, EC2, Elastic IP, DNS, IAM, ECR, EBS, S3 backups, and
  CloudWatch.
- HTTPS and secure host bootstrap.
- SSM-based deployment.
- Database migration and rollback procedure.
- Backup and isolated restore test.
- Operational runbook.

Exit condition: a reviewed Terraform plan creates the environment, a separate
application deployment publishes the PWA, and a restore exercise succeeds.

## Phase 6: Privacy readiness

- Data export.
- Account and content deletion.
- Retention policy.
- Log-redaction verification.
- Session review and revocation.
- Threat-model review and security tests.

Exit condition: the system is suitable for inviting a small number of real
users.

## Phase 7: Volunteer opportunities

- Approve initial sources and review their integration terms.
- Implement provider interface and one adapter.
- Add coarse location and availability preferences.
- Add caching, attribution, rate limiting, and stale-opportunity handling.
- Ensure search and sign-up links do not leak challenge history.

Exit condition: a user can find a currently valid opportunity from an approved
source and record signing up as a challenge action.

## Later exploration

- Optional creative artifacts.
- Generative private wall visualization.
- Monthly reflection.
- Challenge-authoring tools.
- Managed PostgreSQL.
- Multi-instance availability.

## Open product and technical decisions

These require explicit decisions before their implementation phase:

1. Final product name and visual identity.
2. Initial owner-only versus small multi-user launch.
3. Authentication method.
4. Database access and migration tooling.
5. Initial challenge-selection algorithm.
6. Grace-day or streak-freeze behavior.
7. Behavior when a user deletes a wall entry.
8. Time-zone change during an accepted challenge.
9. Initial curated challenge library and review process.
10. Approved volunteer sources.
11. Whether creative artifacts are uploaded or remain device-local.
12. AWS account, region, domain, instance size, and backup retention.
13. Recovery objectives and threshold for moving PostgreSQL to RDS.
14. Notification schedule, content, and opt-in behavior.
