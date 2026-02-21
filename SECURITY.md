# Security Policy

## Scope and Intended Use

Homework is currently designed for local/private use:

- localhost on your own machine
- private network with strict ACLs

Homework is **not** intended to be exposed directly to the public internet.

## If You Host This Publicly

If you run this app on a public host/domain, assume additional hardening is required before it is safe to use.

Known gaps include:

- no full production authn/auth model for all API routes
- limited abuse controls (no robust rate limiting/quotas)
- image proxy is practical for local use, but not fully hardened for hostile internet traffic
- SQLite is single-file and not ideal for concurrent multi-user/multi-process production workloads
- no multi-tenant isolation guarantees
