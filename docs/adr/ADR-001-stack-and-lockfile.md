# ADR-001: Stack and lockfile policy

## Status

Accepted — 2026-07-14

## Context

Funwall needs a single full-stack TypeScript app with shared validation, auth/db, and a reliable test matrix. The master plan listed observed npm versions as of planning date; they must not be pasted blindly.

## Decision

| Layer | Choice | Pinned / range |
|---|---|---|
| Framework | Next.js App Router | `16.2.10` exact |
| UI | React / React DOM | `19.2.4` exact |
| Language | TypeScript strict | `^5.9.3` (not 7.x yet — Next tooling still targets 5.x) |
| Styling | Tailwind CSS v4 + CSS variables | `^4` with `@tailwindcss/postcss` |
| Validation | Zod | `^4.4.3` |
| Backend BaaS | Supabase JS + SSR helpers | `@supabase/supabase-js@2.110.3`, `@supabase/ssr@^0.12.1` |
| Unit tests | Vitest + Testing Library | Vitest `^4.1.10` |
| E2E | Playwright | `@playwright/test@^1.61.1` |
| Package manager | npm with committed lockfile | `package-lock.json` is source of truth |

### Lockfile policy

1. Only the integration lead merges `package.json` / lockfile changes while multi-agent work is active.
2. Prefer exact versions for `next`, `react`, `react-dom`, `eslint-config-next`.
3. Runtime dependency requests from other workstreams go in handoff **Requested integration changes**.
4. No unlicensed clone may be a dependency.

## Consequences

- Wave 1 agents import `@/domain` and `@/services` without adding parallel validation libraries.
- TypeScript 7 is deferred until Next/eslint-config-next document support; re-evaluate in a follow-up ADR.
- Local dev works without Supabase credentials for unit tests; client factories throw `SupabaseConfigError` when env is missing.
