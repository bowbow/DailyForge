# Implementation roadmap

The roadmap favors a complete, testable walking skeleton over building many
features in parallel.

## Phase 0: Decisions and repository foundation

- Confirm product name.
- Select TypeScript runtime, workspace manager, frontend framework, API
  framework, validation approach, database access layer, and test tools.
- Record durable selections in ADRs.
- Add formatting, linting, type checking, test, and dependency-update workflows.
- Add Git ignore rules for application, private data, and Terraform artifacts.
- Create local environment documentation.

Exit condition: a new developer or agent can install dependencies, run checks,
and start the empty web/API skeleton from documented commands.

## Phase 1: Walking skeleton

- Responsive PWA shell with Today, Wall, History, and Settings destinations.
- API health endpoint.
- PostgreSQL migration runner.
- One fictional user in local development only.
- Shared domain package imported by both web and API.
- One hard-coded counter challenge flowing through API and database.

Exit condition: record increments, complete the challenge, and see one wall
entry after a page reload.

## Phase 2: Product MVP

- Versioned challenge catalog and four categories.
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

## Phase 3: PWA resilience

- Install manifest and icons.
- Service-worker application-shell caching.
- IndexedDB read cache and mutation outbox.
- Idempotent progress commands.
- Visible pending/failed synchronization.
- Offline and reconnection end-to-end tests.
- Optional Web Push reminder.

Exit condition: progress recorded during temporary network loss synchronizes
once, without duplication or lost reflection text.

## Phase 4: AWS infrastructure

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

## Phase 5: Privacy readiness

- Data export.
- Account and content deletion.
- Retention policy.
- Log-redaction verification.
- Session review and revocation.
- Threat-model review and security tests.

Exit condition: the system is suitable for inviting a small number of real
users.

## Phase 6: Volunteer opportunities

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
4. Exact TypeScript frameworks and package manager.
5. Database access and migration tooling.
6. Initial challenge-selection algorithm.
7. Grace-day or streak-freeze behavior.
8. Behavior when a user deletes a wall entry.
9. Time-zone change during an accepted challenge.
10. Initial curated challenge library and review process.
11. Approved volunteer sources.
12. Whether creative artifacts are uploaded or remain device-local.
13. AWS account, region, domain, instance size, and backup retention.
14. Recovery objectives and threshold for moving PostgreSQL to RDS.
15. Notification schedule, content, and opt-in behavior.
