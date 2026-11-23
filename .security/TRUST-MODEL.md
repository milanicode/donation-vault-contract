# Trust Model — donation-vault

## Trusted roles

| Role | Trust | Notes |
|------|-------|-------|
| Owner | Trusted only after a successful campaign | Can withdraw the recorded pot once if `totalDeposits >= goal` after `endTime` |
| Depositors | Untrusted | May be EOAs or contracts; can deposit while open; can refund only if the goal is missed |

## Key custody

- Demo / portfolio context: owner is the deployer EOA (or test contract).
- Production use would require multisig or equivalent (see SEC-OPS-* checks).

## External dependencies

- None in the campaign contract (no OpenZeppelin imports).

## Monitoring

- Watch `Deposit` / `Withdraw` / `Refund` events.
- Owner address is immutable in this design.
