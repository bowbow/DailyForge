# AWS and Terraform design

## Goals

- Reproducible AWS infrastructure through Terraform.
- A stable public IPv4 address through a durable Elastic IP.
- Safe EC2 replacement without releasing that address.
- HTTPS, private persistence, backups, monitoring, and no inbound SSH.
- A small initial footprint with a documented growth path.
- Deliberate cost control with no surprise recurring infrastructure.

## Initial topology

```text
Route 53 domain
      │ A record
      ▼
Elastic IP
      │
Public subnet
      │
EC2 instance
  ├── HTTPS reverse proxy
  ├── PWA static assets
  ├── API process
  ├── worker process
  └── PostgreSQL
          │
     encrypted EBS
          │ scheduled logical backups
          ▼
      private S3 bucket
```

This is a single-host design with a known availability limit. It is appropriate
for the initial owner/pilot, not a claim of high availability.

## Cost controls

AWS access never implies authorization to create resources. Before every
cost-producing apply:

1. Produce the Terraform plan.
2. List each created or enlarged resource.
3. Check current official AWS pricing for the selected region.
4. Separate predictable recurring costs from usage-dependent costs.
5. Call out public IPv4, EBS, snapshots, S3, ECR, CloudWatch, DNS, backup, and
   data-transfer charges.
6. Present lower-cost alternatives and their tradeoffs.
7. Obtain explicit user authorization.

Initial cost principles:

- Maintain one production environment and develop locally.
- Select the smallest instance and storage allocation that satisfy measured
  needs.
- Avoid NAT Gateway, Application or Network Load Balancer, RDS, and duplicate
  instances until availability or scale justifies them.
- Add an AWS Budget and notifications before or alongside the first application
  resources.
- Use short, explicit retention for logs, snapshots, backups, and ECR images.
- Detect unattached Elastic IPs and EBS volumes, which can continue to incur
  costs without serving the application.
- Tag supported resources with Project=DailyForge, the environment, and
  ManagedBy=Terraform.

Any temporary cost-bearing resource needs an owner, purpose, expected lifetime,
and teardown step in the plan.

## Terraform ownership

Terraform should manage:

- VPC, public subnet, route table, and internet gateway.
- Security group.
- EC2 instance, encrypted root/data volumes, IAM role, and instance profile.
- Elastic IP and separate association.
- Route 53 record.
- ECR repositories.
- S3 backup bucket and policies.
- CloudWatch log groups, dashboards, and alarms.
- Secret containers and instance permissions to read required values.
- Backup lifecycle and retention resources.

Terraform does not deploy application releases, run database migrations, or
populate secret values.

## Proposed layout

```text
infrastructure/terraform/
  bootstrap/
    main.tf
    variables.tf
    outputs.tf
  modules/
    network/
    app-host/
    backups/
    observability/
  environments/
    production/
      backend.tf
      versions.tf
      providers.tf
      main.tf
      variables.tf
      outputs.tf
      production.tfvars.example
```

Do not create a cloud development environment until there is a demonstrated
need. Local containers are the initial development environment.

## State bootstrap

The bootstrap root creates the S3 state bucket before the production root can
use it. The state bucket requires:

- Versioning.
- Server-side encryption.
- Block Public Access.
- Bucket policy restricted to infrastructure administrators.
- Retention or deletion protection appropriate to the account.

The production backend uses S3-native locking:

```hcl
terraform {
  backend "s3" {
    bucket       = "configured-during-bootstrap"
    key          = "daily-forge/production/terraform.tfstate"
    region       = "configured-region"
    encrypt      = true
    use_lockfile = true
  }
}
```

Backend values are supplied during initialization where appropriate. Do not
commit account-specific credentials.

## Elastic IP lifecycle

The Elastic IP is durable foundation infrastructure:

- Give it prevent_destroy protection.
- Associate it through a separate association resource.
- Point DNS to it.
- Never embed it in application configuration or source.
- Reassociate it when replacing the EC2 instance.
- Call out the brief cutover interruption in every replacement plan.

AWS charges for public IPv4 addresses, including Elastic IPs whether associated
or idle. Keep only the addresses the architecture requires.

If high availability becomes necessary while static addresses remain a
requirement, use a Network Load Balancer with one Elastic IP allocation per
enabled Availability Zone and multiple stateless application instances.

## Network and host security

Inbound security-group rules:

- TCP 80 from the internet for redirect to HTTPS.
- TCP 443 from the internet for the application.
- No TCP 22 rule.

Administrative access uses Systems Manager Session Manager. The instance:

- Requires IMDSv2.
- Uses an encrypted root and data volume.
- Has no long-lived AWS credentials on disk.
- Receives a least-privilege IAM instance profile.
- Sends system and application logs to CloudWatch.
- Uses automated security patching with a controlled maintenance policy.

## TLS and DNS

Use a domain name and Route 53 record; do not ask clients to use the raw Elastic
IP. The reverse proxy initially obtains and renews the public TLS certificate.
The selected proxy and certificate flow must be documented when implemented.

Service workers, Web Push, and other PWA capabilities require a secure context,
making working HTTPS part of the MVP infrastructure rather than a later polish
item.

## Application deployment

Infrastructure and application lifecycles are separate:

```text
Application pipeline:
  test → build image → push ECR → deploy through SSM → migrate → health check

Infrastructure pipeline:
  format → validate → plan → review → explicitly approved apply
```

An application release should not run Terraform merely to update a container
tag. EC2 retrieves an approved image and restarts the relevant processes.

The exact container orchestration on the initial host remains open. A small
Docker Compose deployment is the leading option.

## Persistence and backups

Initial:

- PostgreSQL data on a dedicated encrypted EBS volume.
- Nightly logical backup to a private encrypted S3 bucket.
- Versioning and lifecycle retention.
- Backup-success alarm.
- Documented restore into an isolated database.

Before inviting other users:

- Perform and record a restore test.
- Define recovery point and recovery time objectives.
- Decide whether PostgreSQL should move to RDS.
- Ensure account deletion propagates through backups according to the published
  retention policy.

An EBS snapshot alone is not assumed to be an application-consistent database
backup.

## Observability

Minimum alarms:

- EC2 status-check failure.
- Sustained CPU pressure.
- Low disk space.
- API health-check failure.
- Worker failure.
- Database backup failure.
- TLS renewal failure.

Logs must follow docs/SECURITY_PRIVACY.md and exclude wall/reflection content.

## Terraform workflow

For every infrastructure change:

1. Run terraform fmt.
2. Run terraform validate.
3. Run static/security checks selected for the repository.
4. Produce a saved plan for the intended environment.
5. Review replacements, deletions, IAM changes, public ingress, and cost-bearing
   resources.
6. Review current expected cost and cheaper alternatives.
7. Apply only with explicit authorization.
8. Verify health, backups, DNS, monitoring, and budget visibility.

Never commit:

- Terraform state or backup state.
- Plan files.
- .terraform directories.
- Secret tfvars.
- AWS credentials.

## Growth path

1. Move PostgreSQL to private RDS.
2. Separate API and worker deployments.
3. Put stateless API instances behind a load balancer.
4. Store optional art artifacts in private S3 with narrow signed access.
5. Add a separate staging environment only when release risk justifies it.

## Primary references

- [AWS Elastic IP addresses](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Terraform S3 backend and state locking](https://developer.hashicorp.com/terraform/language/backend/s3)
