# Architecture

Provider -> adapter -> normalized events/markets/odds -> Supabase -> UI.

Bet flow: UI -> server quote -> validation -> atomic bet transaction -> ledger -> receipt.

Settlement: provider result -> settlement service -> market settlement -> ledger -> audit.

Security:
- Never trust client odds, payout or balance.
- Money uses integer minor units.
- Idempotency for money-moving operations.
- Service-role credentials stay server-side.
- Privileged mutations are audited.
- Production wagering requires applicable legal/compliance controls.
