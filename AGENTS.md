# Agent instructions

These instructions apply to the entire Daily Forge repository. A more specific
AGENTS.md in a subdirectory may add rules for that subtree, but must not weaken
the product, privacy, security, infrastructure, or deployment guardrails here.

## Repository purpose

Daily Forge is a private progressive web app that presents one constructive
daily challenge, lets the user track or describe its completion, maintains a
completion streak, and preserves completed actions on a private Wall of
Goodness.

The app supports four challenge categories:

- **Body:** general mobility, strength, balance, and recovery activities that
  complement rather than replace a disciplined training plan.
- **Character:** concrete opportunities to practice qualities such as prudence,
  temperance, courage, patience, honesty, generosity, and humility.
- **Community:** helpful actions and, later, suitable volunteer opportunities
  obtained from approved external sources.
- **Creativity:** small digital-art exercises, constraints, experiments, and
  artifacts.

## Required reading

Before making product, application, data, or infrastructure changes, read:

1. README.md
2. docs/PRODUCT.md
3. docs/UX.md
4. docs/ARCHITECTURE.md
5. docs/DOMAIN_MODEL.md
6. docs/SECURITY_PRIVACY.md
7. docs/INFRASTRUCTURE.md
8. docs/BUILD_PLAN.md
9. docs/STATUS.md
10. docs/ROADMAP.md
11. Relevant records under docs/decisions/

Do not implement an unresolved decision as if it were approved. Make the
smallest reversible choice needed to progress, label it clearly, and update the
roadmap or add an ADR when the decision has lasting architectural consequences.

## Product guardrails

- The Wall of Goodness is private by default. Do not add followers, likes,
  public rankings, competitive leaderboards, or automatic sharing.
- Do not calculate a moral score or claim that the app can determine whether a
  person is good.
- Completion is self-reported. Do not require photographs, location history, or
  third-party verification as proof.
- Never expose another person's identity or circumstances in prompts, logs,
  analytics, notifications, or shared content.
- Physical challenges must support safe variations, contraindication notes, and
  replacement. They must not interfere with the user's running plan.
- Character and community prompts must respect consent. Offering appropriate
  help can count even when the offer is declined.
- Use supportive language. Avoid shame, guilt, punishment, or manipulative
  streak mechanics.
- Preserve lifetime accomplishments when a current streak ends.
- Treat volunteer-source terms of service, robots policies, rate limits, and
  attribution requirements as product requirements. Do not scrape a source
  merely because it is technically possible.

## Architecture boundaries

Use the architecture in docs/ARCHITECTURE.md:

- Keep domain rules in a pure, platform-independent package.
- Domain code must not import React, browser APIs, Node APIs, database clients,
  AWS SDKs, or HTTP frameworks.
- Express external capabilities as interfaces or ports. Implement them in
  adapters.
- Treat the server as authoritative for assignment, completion, and streak
  state. The PWA may evaluate the same shared rules for immediate offline UX.
- Represent tracking as idempotent progress events. Do not reduce all tracking
  to a mutable completed boolean.
- Snapshot challenge wording and the user's completion account into a wall entry
  so historical entries do not change when challenge templates are edited.
- Store timestamps in UTC and retain the user's IANA time zone for local-day
  calculations.
- Make API mutations retry-safe because the PWA may replay queued offline work.
- Use database migrations for every schema change. Never modify a production
  schema manually.

When a change crosses these boundaries, add or update an architecture decision
record under docs/decisions/.

## Expected repository shape

The architecture anticipates this layout once implementation begins:

~~~text
apps/
  web/       responsive installable PWA
  api/       authenticated HTTP API
  worker/    scheduled challenge and notification work
packages/
  domain/    pure TypeScript domain model and rules
  contracts/ validated API commands and responses
  testing/   shared fixtures and test helpers
infrastructure/
  terraform/
    bootstrap/
    environments/production/
    modules/
docs/
~~~

Do not create all directories speculatively. Add them when the corresponding
phase begins and keep this section aligned with the actual repository.

## Development expectations

- Use the accepted stack in ADR 0005 unless a superseding ADR changes it.
- Keep dependency count modest and pin versions through the selected lockfile.
- Do not introduce a framework, monorepo tool, ORM, authentication product, or
  validation library without recording the choice when it will constrain later
  work.
- Keep the web experience usable at Pixel 6 widths and at desktop widths.
- Meet WCAG 2.2 AA expectations where applicable: keyboard access, visible
  focus, semantic controls, sufficient contrast, reduced-motion support, and
  useful screen-reader labels.
- Make offline behavior explicit. Show pending synchronization rather than
  pretending a server write succeeded.
- Add focused unit tests for domain rules, integration tests for persistence and
  APIs, and end-to-end tests for the core daily challenge flow.
- Keep example data fictional and non-sensitive.
- Do not commit generated build output, local databases, Terraform state,
  plan files, credentials, environment files, or exported private wall data.

There are no canonical build commands yet. When project tooling is introduced,
document the exact install, format, lint, type-check, test, local-run, build, and
database-migration commands here and in README.md in the same change.

## Runnable-first delivery

- Optimize first for a real, interactable local application, not for completing
  every production concern before anything can be seen.
- Build vertical slices that cross UI, API, domain, and an adapter.
- The first slice uses an in-memory development adapter so the Today-to-Wall
  flow can run before PostgreSQL, authentication, offline sync, or AWS exists.
- Keep the in-memory adapter behind the same ports as durable persistence. It is
  a development accelerator, not the production database.
- After a visible slice works, replace temporary adapters one boundary at a time
  and preserve the behavior with tests.
- Do not build volunteer integrations, Push, Terraform, or visual polish before
  the core challenge loop runs locally unless the active milestone says so.

## Prolonged and unattended work

When the user authorizes a milestone for prolonged work:

- Treat the milestone and its acceptance criteria in docs/BUILD_PLAN.md as the
  working contract.
- If the user authorizes an extended run, follow its ordered continuation ladder
  after the first milestone completes. Do not stop merely because an early
  checkpoint passed while safe authorized work remains.
- Continue through safe, in-scope tasks without pausing for minor preferences.
  Choose the smallest reversible default and record it in docs/STATUS.md.
- If one task is blocked, work on another independent task in the same milestone
  rather than stopping immediately.
- Run the relevant checks after each meaningful vertical slice and before every
  checkpoint.
- Keep docs/STATUS.md current with completed work, verification results, current
  problems, and the exact next action.
- Preserve a runnable main path. Do not leave the application intentionally
  broken between checkpoints.
- Do not broaden the milestone merely because time remains. Complete tests,
  accessibility, error states, and documentation before starting unrelated
  features.
- Stop for user input when a choice is costly, irreversible, privacy-sensitive,
  externally visible, or would change the agreed product behavior.

Unattended work does not authorize commits, pushes, AWS changes, production
deployments, DNS changes, paid services, secret creation, external messages,
volunteer-site scraping, or destructive operations. The user may explicitly
grant commit and push permission for a particular prolonged run. Production and
destructive actions always require their own explicit authorization.

## Infrastructure rules

- Terraform manages infrastructure; it does not deploy application releases.
- Treat every AWS resource as cost-bearing unless current official pricing proves
  otherwise. Before an apply, summarize fixed, hourly, storage, public IPv4,
  request, logging, backup, and data-transfer costs that could result.
- AWS identity access does not imply permission to create resources. Every
  Terraform apply or other cost-producing cloud mutation requires explicit user
  authorization after plan and cost review.
- Prefer the smallest practical single-environment design. Avoid NAT Gateway,
  load balancers, managed databases, duplicate environments, and continuously
  running resources until their value justifies their recurring cost.
- Tag supported resources consistently with Project=DailyForge,
  Environment=<environment>, and ManagedBy=Terraform so costs can be found and
  attributed.
- Include budget alerts and cost visibility in the first infrastructure plan.
- Identify idle-cost risks such as unattached Elastic IPs, EBS volumes,
  snapshots, retained logs, ECR images, and forgotten test infrastructure.
- Use an S3 backend with encryption, versioning, public access blocked, and
  S3-native state locking.
- Keep Terraform state and plan files out of Git. Assume state can contain
  secrets.
- Do not store secret values in Terraform variables or committed tfvars files.
  Terraform may create secret containers, but values are populated separately.
- Protect the production Elastic IP from accidental destruction. Associate it
  separately from the EC2 instance so an instance can be replaced without
  releasing the address.
- Never hardcode an Elastic IP into application code. Use the configured domain.
- Require IMDSv2, encrypted EBS, least-privilege IAM, and AWS Systems Manager
  Session Manager. Do not open inbound SSH by default.
- Expose only HTTP for redirect and HTTPS for application traffic.
- Run terraform fmt and terraform validate for Terraform changes. Produce and
  review a plan before any apply.
- Never run terraform apply, terraform destroy, publish, DNS changes, database
  migrations against production, or other production mutations without the
  user's explicit authorization.
- Avoid destroy-and-recreate changes to durable resources. Call out replacement
  in the handoff and in the Terraform plan review.
- Backups are incomplete until a restore procedure has been tested.

## Security and privacy rules

- Do not log reflection text, wall-entry text, credentials, session tokens,
  precise location, or volunteer-related personal details.
- Use HTTPS in all non-local environments.
- Prefer secure, HttpOnly, SameSite cookies for browser sessions and protect
  state-changing requests from CSRF.
- Validate all input at the API boundary and encode untrusted content on output.
- Give external volunteer-provider content the same treatment as untrusted user
  input.
- Use maintained security and authentication libraries rather than home-grown
  cryptography.
- Provide data export and permanent account deletion before inviting real users
  beyond the initial owner.
- Update docs/SECURITY_PRIVACY.md when data collection, retention, sharing,
  authentication, or third-party integrations change.

## Documentation and decision discipline

- Update documentation in the same change as behavior.
- Product behavior belongs in PRODUCT.md or UX.md.
- Domain invariants belong in DOMAIN_MODEL.md.
- Component boundaries and runtime flows belong in ARCHITECTURE.md.
- AWS resources, state, deployment, and recovery belong in INFRASTRUCTURE.md.
- Milestone tasks and acceptance criteria belong in BUILD_PLAN.md.
- Current progress, verification, blockers, and next action belong in STATUS.md.
- Major durable decisions require an ADR using the template in
  docs/decisions/README.md.
- Keep ADRs immutable after acceptance except for status or clarifying notes;
  supersede an old decision with a new record instead of rewriting history.
- Clearly distinguish confirmed decisions, proposals, and open questions.

## Change safety

- Inspect the repository and working tree before editing.
- Preserve unrelated user changes and keep diffs focused.
- Do not commit, push, deploy, or publish unless explicitly asked.
- Do not delete user data or durable AWS resources without explicit
  authorization and a verified target.
- If a request conflicts with the private, non-competitive purpose of the
  product, identify the conflict before implementing it.
