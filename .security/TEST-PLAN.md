# Test Plan — donation-vault

## Unit / fuzz

- Campaign lifecycle: deposit window, goal success / failure, events
  (`test/DonationVault.t.sol`).

## Invariants

- Stateful campaign in `test/Invariants.t.sol`:
  - `invariant_claimableFundsCovered`
  - `invariant_outstandingNeverExceedsTotalDeposits`
  - `invariant_ownerWithdrawnImpliesGoalMet`

## Exploit regressions

- `test/exploits/AccessControl.t.sol` — unauthorized withdraw
- `test/exploits/Reentrancy.t.sol` — reentrant withdraw attempt

## Static analysis

- Slither full run triaged at medium+ (`SEC-TEST-005`).
