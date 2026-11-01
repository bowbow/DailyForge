# Architecture decision records

Architecture decision records capture durable choices and their consequences.
They prevent later agents from silently reversing decisions or mistaking an old
discussion for current direction.

## Index

- [0001 — Build an installable PWA](0001-progressive-web-app.md)
- [0002 — Use a shared pure domain with ports and adapters](0002-shared-domain-and-ports.md)
- [0003 — Provision the initial AWS host with Terraform and a durable Elastic IP](0003-terraform-ec2-elastic-ip.md)
- [0004 — Keep the Wall of Goodness private](0004-private-wall-of-goodness.md)
- [0005 — Adopt the initial TypeScript application stack](0005-typescript-application-stack.md)
- [0006 — Keep generative AI out of the application runtime](0006-no-generative-ai-at-runtime.md)

## Status values

- Proposed
- Accepted
- Superseded
- Rejected

## Template

```markdown
# NNNN — Decision title

- Status: Proposed
- Date: YYYY-MM-DD

## Context

What problem or pressure requires a decision?

## Decision

What are we choosing?

## Consequences

What becomes easier, harder, required, or unavailable?

## Alternatives considered

What meaningful alternatives were evaluated?
```

After a record is accepted, do not rewrite the decision. Add clarifying notes or
create a new record that supersedes it.
