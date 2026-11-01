# Application architecture

## Architectural goals

- Run as an installable responsive PWA on a Google Pixel 6 and desktop browsers.
- Share domain behavior between browser and server without coupling it to either.
- Remain useful during temporary network loss.
- Synchronize a private Wall of Goodness between devices.
- Isolate volunteer providers and AWS infrastructure from product rules.
- Make the initial single-host deployment replaceable without redesigning the
  domain.

## System context

```text
┌───────────────────────────────┐
│ Pixel 6 or desktop browser    │
│                               │
│ Responsive PWA                │
│ IndexedDB cache and outbox    │
└───────────────┬───────────────┘
                │ HTTPS JSON API and Web Push
                ▼
┌───────────────────────────────┐
│ Application host              │
│                               │
│ API        Scheduled worker   │
│ Shared domain package         │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
   PostgreSQL       Approved volunteer
   database         provider APIs/sites
```

## Logical layers

### Domain

Pure rules and types:

- Challenge definitions and assignments.
- Tracking modes and progress events.
- Completion policies.
- Streak transitions.
- Wall-entry creation.
- Local-day and time-zone rules expressed through injected clock/calendar
  abstractions.

The domain layer has no UI, database, HTTP, Node, browser, or AWS dependencies.

### Application

Use cases that coordinate domain objects and ports:

- Assign today's challenges, with at most one active assignment per category.
- Accept, replace, or skip a challenge.
- Record progress.
- Complete a challenge.
- Append a wall entry.
- Query wall and history.
- Schedule and send a reminder.
- Search approved volunteer opportunities.

### Ports

Interfaces owned by the application:

- ChallengeCatalog.
- AssignmentRepository.
- ProgressRepository.
- WallRepository.
- UserPreferenceRepository.
- VolunteerOpportunityProvider.
- NotificationGateway.
- UnitOfWork.
- Clock and IdentifierGenerator.

### Adapters

- PostgreSQL persistence.
- HTTP controllers.
- IndexedDB cache and synchronization outbox.
- Browser Push subscription.
- Web Push delivery.
- Approved volunteer-provider clients.
- AWS Secrets Manager or Parameter Store access.
- Structured logging and metrics.

### Presentation

The responsive PWA renders application state and produces commands. It may use
the shared domain package for immediate progress calculations, but the server
remains authoritative for durable assignment, completion, and streak state.

## Anticipated code organization

```text
apps/
  web/
  api/
  worker/
packages/
  domain/
  contracts/
  testing/
infrastructure/
  terraform/
docs/
```

The exact workspace manager, frontend framework, HTTP framework, validation
library, ORM/query layer, and test runner remain open decisions. The intended
language is TypeScript unless superseded by an ADR.

## API style

Use a versioned HTTPS JSON API. Commands should model user intent rather than
generic table updates.

Illustrative endpoints:

```text
GET    /api/v1/today
POST   /api/v1/challenges/{assignmentId}/accept
POST   /api/v1/challenges/{assignmentId}/replace
POST   /api/v1/challenges/{assignmentId}/skip
POST   /api/v1/challenges/{assignmentId}/progress-events
POST   /api/v1/challenges/{assignmentId}/complete
GET    /api/v1/wall
GET    /api/v1/history
GET    /api/v1/export
DELETE /api/v1/account
```

These names are design examples, not a frozen contract.

Each mutation accepts a client-generated command or event ID. Replaying the same
ID must not double-count push-ups, create duplicate completions, or extend a
streak twice.

## Offline and synchronization strategy

The PWA uses an IndexedDB outbox:

1. Create an immutable progress event with a unique client ID.
2. Apply it locally for immediate feedback.
3. Mark it pending.
4. Send it to the API when online.
5. Mark it acknowledged using the server response.
6. Reconcile authoritative totals and completion state.

Reflections should remain available locally until acknowledged. Retry behavior
must be safe and must never duplicate a wall entry.

The service worker caches the application shell and selected read responses. It
does not contain authentication secrets or private wall data in a shared cache.

## Server processes

### API

- Authenticates the user.
- Validates commands.
- Applies shared domain rules.
- Persists transactional changes.
- Returns authoritative state.

### Worker

- Assigns a challenge if assignment is server-driven.
- Sends opted-in daily Web Push reminders.
- Refreshes permitted volunteer-provider data.
- Runs retention and operational jobs.

API and worker may initially run from the same image or repository but must have
separate entry points so they can be scaled or moved independently.

## Persistence

PostgreSQL is the intended durable store. It can initially run on the EC2 host
on an encrypted data volume; moving it to RDS should not change domain or API
behavior.

Use migrations and transactional completion:

1. Lock or version-check the assignment.
2. Insert any final progress event.
3. mark the assignment complete.
4. update streak aggregates.
5. insert a wall-entry snapshot.
6. commit once.

## Notifications

Daily reminders use Web Push sent by the server. Do not rely on browser periodic
background sync to fire at an exact time. Notification text must remain generic
unless the user explicitly opts into showing challenge details on the lock
screen.

## Volunteer integration

Each source implements VolunteerOpportunityProvider and maps external data into
a stable internal representation. Provider adapters own:

- Authentication.
- Rate limiting and retry.
- Attribution.
- Terms and robots-policy compliance.
- Sanitization.
- Source-specific location and date formats.

The domain never parses a provider's HTML or response schema.

## Observability

Record:

- Request IDs, status, latency, and error type.
- Synchronization retries and queue depth.
- Worker success and failure counts.
- Provider health and rate-limit events.
- Database and backup health.

Do not record:

- Reflection or wall-entry text.
- Session tokens or credentials.
- Names or details about people helped.
- Precise user location.

## AI boundary

ADR 0006 keeps generative AI outside the application runtime. The PWA, API, and
worker use deterministic, versioned challenge definitions, capability state,
progression ladders, safety constraints, and selection rules. They do not call
or require a model service.

AI may assist normal development and may analyze an explicitly exported,
minimized set of structured observations in a separately initiated offline
workflow. Such analysis can only propose versioned program or user-plan
artifacts. Proposals are untrusted until they pass schema validation, hard
safety constraints, tests and historical replay, human review, and an auditable
approval and publication step. AI cannot write directly to production or
weaken runtime safety rules.

## Evolution path

- Initial: one EC2 host, one database, one worker, one Elastic IP.
- Next: managed database, independent worker, object storage for optional
  artifacts.
- Scale: load-balanced stateless API instances and managed scheduling.

Ports and process boundaries exist to make this evolution possible without
prematurely deploying a distributed system.
