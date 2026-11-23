# Assumptions — donation-vault

> External facts this project's security depends on but does not verify on-chain.

## Assumptions

- The `owner` address is controlled by the intended operator for this demo deployment.
- Callers may be contracts; the design does not assume EOAs.
- Solidity 0.8+ checked arithmetic is enabled (no unchecked overflow on deposit accounting).
- Campaign parameters (`goal`, `endTime`) are chosen correctly at deploy time.
- After a successful raise, donors trust the owner to use funds as promised.

## Rejected assumptions

- We do NOT assume the owner key cannot be compromised (accepted operational risk for this portfolio demo).
- We do NOT assume ETH forced into the contract via `selfdestruct` / `vm.deal` is withdrawable as recorded deposits.
- We do NOT assume donors can exit early; refunds exist only after a failed campaign.
- We do NOT assume a depositor list must be iterated on withdraw (that design was removed).
