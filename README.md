# Sportsbook Core

Original sports-only sportsbook platform for football, cricket, tennis, basketball and additional sports.

## Stack
Next.js 15 + TypeScript + Tailwind + Supabase.

## Architecture
- Provider adapter normalizes fixtures, markets, prices and results.
- Supabase stores sports, competitions, participants, events, markets, selections, quotes, bets, wallets, ledger and audit records.
- Server-side quote validation prevents client-supplied odds or payout values from being trusted.
- Money values use integer minor units.
- Bet placement is atomic and idempotent.
- Admin access is role-based and privileged actions are audited.

## Environment
Set these in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never expose a Supabase secret/service-role key to the browser.

## Data
The free-plan setup uses the existing CreatorFix Global Supabase project with a dedicated `sportsbook` PostgreSQL schema isolated from existing application tables.

## Production readiness
Live wagering requires the operator to complete all applicable licensing, age verification, KYC/AML, payment, responsible-gambling, tax, privacy, security, geolocation and jurisdiction controls before enabling real-money operation. The application architecture keeps those provider/compliance integrations behind server-side boundaries.
