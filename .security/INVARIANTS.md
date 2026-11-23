# Invariants — donation-vault

> Invariants live machine-readably in `.security/invariants.yaml`. This
> document is the human rationale: WHY each property must hold.

## INV-001 — Claimable funds covered

- **Property**: Until the owner withdraws a successful pot, vault ETH covers outstanding `deposited` balances of known actors.
- **Why**: Donors (failed campaign) or the owner (successful campaign) must be able to claim what accounting promises.
- **Tested by**: `invariant_claimableFundsCovered`

## INV-002 — Outstanding never exceeds total raised

- **Property**: Sum of remaining `deposited` values ≤ `totalDeposits`.
- **Why**: Refunds zero individual deposits; lifetime raised is never understated relative to remaining claims.
- **Tested by**: `invariant_outstandingNeverExceedsTotalDeposits`

## INV-003 — Non-owners cannot withdraw

- **Property**: `withdraw` reverts unless `msg.sender == owner`.
- **Tested by**: unit + `test_UnauthorizedWithdrawReverts`

## INV-004 — Owner withdraw implies goal met

- **Property**: `ownerWithdrawn => totalDeposits >= goal`.
- **Tested by**: `invariant_ownerWithdrawnImpliesGoalMet`
