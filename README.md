# Sportsbook Core

Original sports-only sportsbook foundation.

Current phase: demo/simulation-first. Production real-money wagering must be gated behind applicable licensing, age/KYC/AML, payment and responsible-gambling compliance.

## Stack
Next.js + TypeScript + Tailwind + Supabase.

## Data
The free-plan setup uses the existing CreatorFix Global Supabase project with a dedicated `sportsbook` PostgreSQL schema, isolated from existing public tables.

## Roadmap
1. Sportsbook UI
2. Provider adapter + fixture/odds sync
3. Bet slip + server-side quote validation
4. Demo wallet and atomic bet engine
5. Settlement engine
6. Admin/risk/audit
7. Production compliance gates
