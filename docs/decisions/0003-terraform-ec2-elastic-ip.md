# 0003 — Provision the initial AWS host with Terraform and a durable Elastic IP

- Status: Accepted
- Date: 2026-10-30

## Context

The PWA requires HTTPS hosting, an API, scheduled work, private persistence, and
a stable endpoint. The initial user base is small, while the infrastructure must
remain reproducible and maintainable. A fixed public IPv4 address is desired.

## Decision

Provision the initial production environment with Terraform:

- One EC2 application host.
- One durable Elastic IP associated separately from the instance.
- Route 53 DNS pointing to the Elastic IP.
- Encrypted EBS persistence.
- Private S3 backups.
- ECR for application images.
- CloudWatch monitoring.
- Systems Manager Session Manager instead of inbound SSH.
- S3 remote Terraform state with versioning, encryption, and native lockfiles.

Protect the Elastic IP against accidental destruction. Keep application release
deployment separate from Terraform.

## Consequences

- The EC2 instance can be replaced while retaining the public address.
- Instance replacement still causes a short cutover interruption.
- The initial system has a single-host availability limit.
- AWS charges for the public IPv4 address.
- Host patching, TLS renewal, database operations, backup testing, and monitoring
  are our responsibility.
- A later high-availability fixed-IP design would use a Network Load Balancer
  with Elastic IPs per Availability Zone.

## Alternatives considered

### Application Load Balancer

Provides managed HTTP routing and health checks but does not expose fixed
Elastic IP addresses directly.

### Static hosting plus serverless API

Reduces host operations but diverges from the desired EC2 and Elastic IP design
and may complicate scheduled provider integrations during the first build.

### Manually configured EC2

Quick for an experiment but not reproducible, reviewable, or maintainable.
