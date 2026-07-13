# Workstream 12: deployment, CI, observability, backup, and release

Recommended model: a senior platform/DevOps agent experienced with Vercel, Supabase, secrets, migrations, monitoring, and rollback.

## Mission

Make Funwall safely deployable and operable from preview through production: environments, CI gates, migration process, secrets, domain/headers, monitoring, rate limits, backup/restore, release checklist, and rollback runbook.

## Starts when

- A foundation health page can deploy.
- Final release work starts only after all six templates are integrated and QA has a stable suite.

## Owned scope

- CI/deployment configuration approved by integration lead
- Environment and operations docs
- Monitoring/alerting setup
- Migration/deploy/runbook artifacts
- Backup/restore and release evidence

Do not change domain/game logic to accommodate deployment without returning the issue to its owner.

## Deliverables

### A. Environment model

- Local, test, preview, production.
- Separate Supabase projects or a documented safe isolation strategy.
- Environment variable inventory: purpose, secret/public, owner, rotation, where configured.
- Startup validation with no secret values in logs.
- Test/preview provider quotas cannot exhaust production.

### B. CI gates

On pull request/integration branch:

- Install from lockfile.
- Static type/lint/format checks.
- Unit/component tests.
- Build.
- Migration validation against disposable database where practical.
- Security/dependency scan.
- Selected E2E smoke against preview after deploy.

On release candidate:

- Full E2E matrix.
- RLS matrix.
- Visual review gate.
- Production migration plan approval.

### C. Vercel/Supabase deployment

- Preview deployment per integration change.
- Production project with least-privilege integrations.
- Supabase URL/anon key exposure only where intended; service role server-only.
- Storage policies and CORS.
- Openverse/Pexels keys server-only.
- Image processing runtime compatibility verified.
- Custom domain/TLS if supplied later.

### D. Security headers and platform limits

- Content Security Policy covering app, chosen image/storage providers, and no unnecessary wildcard script origins.
- HSTS, frame policy/frame ancestors, referrer policy, MIME sniffing protection, permissions policy.
- Decide whether public activities may be embedded; if not, deny framing. If later enabled, scope origins explicitly.
- Server/body/upload/time limits documented.
- Rate limits for login, media search/upload, public resolution, session events, result/name submission.

### E. Migration process

- Immutable numbered migrations.
- Apply forward in preview before production.
- Preflight backups for risky changes.
- Backward-compatible expand/migrate/contract pattern when needed.
- Never run destructive schema change automatically without reviewed data plan.
- Record current migration/version in diagnostics.

### F. Observability

- Structured server errors with request/diagnostic ID and no content/secrets.
- Health/readiness checks for web/database/storage/provider dependencies, with external providers treated as degradable where possible.
- Metrics or dashboard for error rate, latency, autosave failures, provider failures, session completion failures, invalid/tampered results.
- Alerts with actionable thresholds and owner route.
- Client error capture respecting content privacy.

### G. Backup/restore

- Database backup schedule/retention.
- Storage inventory/backup or provider-resolvable strategy.
- Restore rehearsal into a non-production environment.
- Verify activities, versions, media, public state, and results after restore.
- Record recovery-point and recovery-time expectations.

### H. Release and rollback

- Pre-release checklist referencing master definition of done.
- Production smoke for login, saved Wheel, image search/upload, each public template, result, disabled link.
- Release tag/version and change log.
- Rollback web deployment procedure.
- Database forward-fix/rollback decision tree.
- Incident runbook: auth outage, Supabase outage, provider outage, corrupt migration, runaway quota, leaked key.

## Acceptance criteria

- Preview and production use separate protected data/secrets.
- A fresh preview can be created from the repository and migrations alone.
- CI blocks red tests/build/security gates.
- No service role/provider secret appears in client bundle/logs.
- Provider outage degrades image search but saved activities still create/edit where possible and existing games play.
- Backup restore is demonstrated, not only documented.
- Production rollback is rehearsed for web and has an explicit database strategy.
- Monitoring catches an injected autosave failure and session completion failure in non-production.

## Stop rule

Stop before weakening CSP/RLS/tests for deployment convenience, sharing production secrets in files/chat, or applying destructive production migrations without backup and reviewed data plan.

## Copy-ready assignment prompt

> Recommended model: a senior Vercel/Supabase platform agent. Read the master production gates, shared contracts, and this packet. Build isolated environments, CI, preview/production deployment, secret inventory, headers/rate limits, migration process, observability, backup/restore rehearsal, release checklist, and rollback/incident runbooks. Prove no secrets in client/logs, a fresh environment from migrations, provider degradation, monitoring alerts, and restored data. Do not weaken security/tests or run destructive production changes without reviewed backup.

