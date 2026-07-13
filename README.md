# Funwall

Clean-room classroom activity platform: create, save, and play six activity templates (Wheel, Matching Pairs, Gameshow Quiz, Wordsearch, Image Quiz, True/False).

## Status

Phase 1 scaffold is in place: Next.js App Router, frozen domain contracts, template registry stub (Wheel registered), design tokens, and route shells. Product planning lives in [`FUNWALL_MASTER_PLAN.md`](FUNWALL_MASTER_PLAN.md). Multi-agent work packets live in [`agent-work/`](agent-work/README.md).

## Prerequisites

- Node.js 20+ (developed on Node 24)
- npm 10+

Supabase credentials are **optional** for unit tests and static UI stubs. They are required for real auth/database work (Workstream 01).

## Local setup

```bash
# Install dependencies (uses package-lock.json)
npm install

# Optional: configure env for Supabase / media
cp .env.example .env.local
# Edit .env.local with real values when you have a project

# Develop
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit/component suite |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright (starts dev server) |
| `npm run test:e2e:install` | Install Playwright browsers |

## Import map for agents

| Need | Import |
|---|---|
| Content schemas, template keys, results, snapshots | `@/domain` |
| Seeded RNG, timer, semantic audio, Supabase factories | `@/services` |
| Template registry | `@/features/templates` |
| Editor adapter types / noop | `@/features/editor` |
| Player adapter types / noop | `@/features/player` |
| Design system primitives | `@/design-system` |
| Classroom fixture builders | `@/test/fixtures` |

## Architecture docs

- Contracts: [`agent-work/shared/CONTRACTS.md`](agent-work/shared/CONTRACTS.md)
- ADRs: [`docs/adr/`](docs/adr/)
- Integration board: [`docs/integration-status.md`](docs/integration-status.md)
- Design tokens (product): [`docs/references/design-tokens.md`](docs/references/design-tokens.md)
- Third-party process: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)

## Database

Initial SQL stub: [`supabase/migrations/20260714000000_initial_schema.sql`](supabase/migrations/20260714000000_initial_schema.sql). Apply when a Supabase project is linked. Workstream 01 tightens RLS and storage.

## Product boundaries

- Exactly six launch templates.
- Public players need no account.
- Wheel is unscored and never has a leaderboard.
- Game-affecting randomness is seeded.
- Greenfield only — no unlicensed clone code or assets.
