# Security and privacy

## Privacy promise

The Wall of Goodness is private. It may contain personal reflections and
descriptions involving other people, so the system treats it as sensitive user
content rather than ordinary engagement data.

## Data classes

### Account data

- User ID.
- Authentication identifiers.
- Time zone and preferences.

### Sensitive content

- Progress narratives.
- Reflections.
- Wall entries.
- Physical limitations.
- Optional artifacts.
- Volunteer preferences or location.

### Operational data

- Request ID.
- Endpoint and status code.
- Timing.
- Error category.
- Aggregate health metrics.

Sensitive content must not be copied into operational logs.

## Core requirements

- HTTPS for every non-local connection.
- Strong authentication using a maintained library or managed service.
- Secure, HttpOnly, SameSite session cookies where browser sessions are used.
- CSRF protection for state-changing requests.
- Server-side authorization on every user-owned object.
- Input validation at every trust boundary.
- Context-appropriate output encoding and content-security policy.
- Rate limiting for authentication and resource-intensive endpoints.
- Encryption for EBS, S3 backups, Terraform state, and managed secrets.
- Dependency and base-image updates.
- Data export and permanent account deletion.

## Authentication decision

The exact authentication mechanism remains open. Candidates include:

- Managed identity through Amazon Cognito.
- Passkeys through a maintained WebAuthn-capable authentication library.
- Email and password through a maintained authentication library.

Do not implement custom credential storage or cryptography. The choice must be
recorded in an ADR before real user accounts are created.

## Session behavior

- Use short-lived server sessions with deliberate renewal.
- Revoke sessions after password or credential changes.
- Do not store bearer tokens in localStorage.
- Protect account export, deletion, and security changes with recent
  authentication.
- Allow the user to view and revoke active sessions when the product expands
  beyond a single owner.

## Logging rules

Never log:

- Challenge-account or reflection text.
- Wall-entry text.
- Passwords, session cookies, tokens, or Push private keys.
- Exact volunteer-search location.
- Names or descriptions of people the user helped.
- Raw request bodies for sensitive endpoints.

Use stable error codes and redacted structured fields. Production error reports
must be reviewed for accidental sensitive payload capture.

## Notifications

Lock-screen notifications can expose information. Default notification text
should be generic:

> Your Daily Forge challenge is ready.

Showing the challenge title or streak requires explicit user preference.
Reflection or wall text must never appear in notifications.

## Volunteer providers

- Send the minimum location precision required for search.
- Disclose the source and link to its terms.
- Treat responses as untrusted content.
- Sanitize markup and outbound links.
- Keep provider credentials server-side.
- Respect rate limits, attribution, robots policies, and deletion requirements.
- Do not reveal a user's challenge history to a provider.

## Data retention and control

Before external users are invited, define:

- Account and content retention periods.
- Backup retention and deletion lag.
- Export format.
- Account deletion workflow.
- Treatment of de-identified operational metrics.
- Whether deleted wall entries also delete completion records.

The UI must explain when backup retention prevents immediate physical erasure
and when the data will age out.

## Infrastructure security

- No public SSH port.
- Administrative access through AWS Systems Manager Session Manager.
- IMDSv2 required.
- Least-privilege instance role.
- Security group ingress limited to HTTP redirect and HTTPS.
- Database not exposed publicly.
- Secret values supplied outside Terraform state.
- Encrypted, versioned, access-controlled backups.
- CloudWatch alarms for availability, disk pressure, backup failure, and
  suspicious authentication patterns.

## Threats to test

- Cross-user ID enumeration.
- Duplicate offline-event replay.
- CSRF on progress, completion, export, and deletion.
- Stored cross-site scripting in reflections and volunteer content.
- Session theft and fixation.
- Brute-force authentication.
- Malicious links from external providers.
- Accidental private-content logging.
- Backup exposure.
- Time-zone manipulation to extend a streak incorrectly.
- Denial of service through oversized reflections or repeated search.

## Incident readiness

Document before launch:

- How to revoke sessions and credentials.
- How to rotate Push, database, and provider secrets.
- How to restore the database to an isolated environment.
- How to identify affected records without reading unrelated wall content.
- How to notify users if private content may have been exposed.
