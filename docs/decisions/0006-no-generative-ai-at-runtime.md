# 0006 — Keep generative AI out of the application runtime

- Status: Accepted
- Date: 2026-10-31

## Context

AI is useful while researching, designing, implementing, testing, and improving
Daily Forge. It may also find useful patterns in accumulated Body observations
and propose improvements to challenge content, progression ladders, selection
rules, or an individual capability plan.

Daily Forge must not, however, depend on an AI model while serving the user.
Runtime model calls would introduce network and provider dependencies,
unpredictable latency, variable output, token and API costs, credential
management, additional privacy exposure, and reduced reproducibility. These are
especially undesirable where challenge selection and progression affect
physical safety.

The product still needs a controlled way to learn from offline AI analysis
without allowing generated output to become an unaudited exercise
prescription.

## Decision

Daily Forge will have **no generative-AI dependency in its application
runtime**.

The deployed PWA, API, and worker must not call a language-model or generative-AI
inference API, embed provider credentials, require a model service, or generate
user challenges from an unconstrained model response. The application must
remain fully functional when no AI service is available.

Runtime behavior will be deterministic and versioned. Challenge definitions,
capability estimates, progression and regression ladders, recovery rules,
safety constraints, and selection policies will be represented as ordinary
validated code or data. Given the same program version and authoritative user
state, the runtime should reach the same decision and retain enough rationale
to explain why a challenge was selected.

AI is permitted in two non-runtime roles:

1. **Development assistance.** AI may research evidence, draft challenge
   content, propose architecture or code, generate tests, and help analyze
   defects. Its output enters the product through the normal reviewed,
   version-controlled development process.
2. **Offline program analysis.** A deliberately initiated process may give an
   AI an explicitly exported, minimized set of structured observations. The AI
   may produce findings and proposed program or user-plan changes. The runtime
   does not call or wait for this process and continues operating without it.

Offline AI output is untrusted input. Before an output can influence the
application, it must:

- conform to an explicit, versioned schema;
- reference only known challenge, capability, and progression identifiers;
- pass deterministic safety and progression constraints that AI cannot weaken;
- be checked against recent workload, prerequisites, recovery, and running-plan
  conflicts where applicable;
- pass automated tests and historical replay or simulation appropriate to the
  change;
- receive human review and approval unless a later accepted ADR defines a
  comparably safe approval mechanism; and
- be stored as a versioned, auditable artifact with its input snapshot,
  rationale, validation results, approver, and rollback path.

AI analysis must not write directly to the production database, publish a
program bundle, change a user plan, loosen a safety tier, or perform a
production deployment.

Data supplied for offline analysis will be allow-listed and minimized. Body
analysis should normally use structured observations such as challenge and
variation, load, repetitions, duration, support, side, perceived difficulty,
pain or instability flags, next-day response, completion date, and relevant
training-day classification. Private Wall reflections, accounts involving
other people, names, precise location, credentials, and unrelated free text are
excluded by default. Sending personal data to an external AI provider requires
an explicit, separately reviewed disclosure and consent decision.

This decision concerns generative AI. It does not prevent deterministic
algorithms, conventional calculations, statistical summaries, or locally
evaluated rules from adapting challenges at runtime.

## Consequences

- Daily Forge has no runtime token cost, inference latency, model credential, or
  AI-provider availability requirement.
- Challenge selection and progression remain reproducible, testable,
  explainable, and bounded by hard safety rules.
- AI can still accelerate development and periodically improve the program from
  real observations.
- The data model must capture sufficiently rich structured observations for
  deterministic adaptation and useful offline analysis.
- Offline export, analysis, validation, approval, artifact versioning, and
  rollback require explicit tooling if and when that workflow is implemented.
- AI-suggested improvements take longer to reach users than direct runtime
  generation because they pass through validation and review.
- Free-form AI personalization and conversational runtime coaching are outside
  the accepted architecture unless this record is superseded.

## Alternatives considered

### Call an AI model for each daily challenge

This could produce highly varied natural-language challenges, but makes core
behavior dependent on a paid external service and allows nondeterministic output
inside a safety-sensitive flow. Rejected.

### Run a model automatically in a scheduled production worker

This removes model latency from the interactive request but retains cost,
privacy, reproducibility, and autonomous-mutation risks. It also turns AI into a
production dependency. Rejected unless a future ADR defines a tightly bounded
use that preserves the decision's safety and approval requirements.

### Let offline AI update plans without review

This is operationally convenient but allows generated errors to bypass product
and safety controls. Rejected.

### Prohibit all AI use

This would avoid AI-specific risk but discard useful assistance for research,
implementation, testing, and controlled offline analysis. Rejected.
