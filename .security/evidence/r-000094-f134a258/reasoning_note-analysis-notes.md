# Security analysis notes — donation-vault (agent:cursor)
# Used as --analysis evidence for hybrid checks after campaign redesign.

## Campaign model inventory

Contract: `src/DonationVault.sol`

State-changing external entrypoints:
- `deposit()` — open by design while `block.timestamp < endTime`; requires `msg.value > 0`. src/DonationVault.sol:82-90
- `withdraw()` — restricted `onlyOwner`; requires closed campaign, goal met, `!ownerWithdrawn`. Sets `ownerWithdrawn = true` before ETH call. src/DonationVault.sol:94-106
- `claimRefund()` — open to depositor after failed campaign; zeros `deposited[msg.sender]` before ETH call. src/DonationVault.sol:109-122
- `receive` / `fallback` — revert (`Use deposit()`). src/DonationVault.sol:140-146

Views: `isOpen()`, `goalReached()`, public getters. No pause, rescue, sweep, upgrade, oracle, or setter functions.

## SEC-PROC-004 / assumptions cross-check

Reviewed ASSUMPTIONS.md and TRUST-MODEL.md against DonationVault.sol:
timed goal campaign, owner withdraw only on success, donor refunds on failure,
CEI on withdraw/refund, no depositor loop, forced ETH not withdrawable beyond
recorded totals. Owner key compromise remains accepted operational risk (THR-005).

## SEC-ACCESS-001 — privileged function inventory

- `deposit()` — open by design (any address, positive value, while open). :82
- `withdraw()` — `onlyOwner` (:60-63, :94). Unauthorized covered by
  `test_AccessControlUnauthorizedWithdrawReverts` / `testWithdrawRevertsForNonOwner`.
- `claimRefund()` — open by design after failure; limited to caller’s `deposited`.
No other external/public state-changing functions.

## SEC-ACCESS-002 / 003 / 006 / 007

- Owner is immutable (constructor only :70-76); no role rotation — accepted for
  demo (ASSUMPTIONS / THR-005). Test: `test_OwnershipImmutableSingleKeyAccepted`.
- No config setters (goal/endTime fixed at deploy).
- No pause/unpause functions. Test: `test_PauseNotPresent`.
- No selfdestruct / rescue / sweep. Test: `test_RescueSweepNotPresent`.
- Authorization uses `msg.sender` only; no `tx.origin`. Test: `test_TxOriginNotUsedForAuth`.

## SEC-REENT-001 / 002 — external call sites

- `withdraw`: `ownerWithdrawn = true` then `owner.call{value: amount}` (:99-103).
- `claimRefund`: `deposited[msg.sender] = 0` then `msg.sender.call{value: amount}` (:116-119).
- Nested withdraw during receive hits `Already withdrawn` (exploit regression
  `test_ReentrantWithdrawDoesNotOverDrain`).

## SEC-EXT-002 / 005 / 004 / 007 — call handling

- Low-level call success checked with `require(sent, "ETH transfer failed")`.
- Uses `call` not `transfer`/`send`; no return-data decoding.
- Default gas stipend (no custom gas limit) intentional for simple ETH send.
- Tests: `test_ReturnDataNotDecoded`, `test_GasGriefStipendDefaultCall`.

## SEC-MATH-001 / 002 / 005 / 006 / 007

- No share conversion, no `mulDiv`, no interest index, no fee math in
  `src/DonationVault.sol`. Accounting is exact `+=` / assignment of stored wei.
- Rounding/cycling checks are therefore N/A to application math; fuzz still
  proves deposit accounting identity: `testFuzz_RoundExactAccounting`,
  `testFuzz_MathNoMulDiv`, `test_IndexAccrualNotPresent`.

## SEC-DOS-001 / 003 / 004

- No loops over attacker-grown sets in `src/DonationVault.sol` (depositors array removed).
- No pagination/cursor patterns. Test: `test_LoopPaginationNotPresent`.
- Failed external recipient cannot brick others: owner withdraw failure reverts
  only that call; donors refund independently. Test: `test_GriefExternalCallCannotBrickSharedFlow`.

## SEC-ECON-001 / 002 / 003 / 005

- No oracle/pricing; deposits are absolute ETH amounts (no slippage parameter).
- Flashloan capital only increases deposit weight; does not unlock owner withdraw
  before endTime/goal rules.
- Tests: `test_SlippageMevNotApplicableAbsoluteEth`, fuzz liquidity extremes via
  `testFuzz_*`, exploit stub `test/exploits/Econ.t.sol`.

## SEC-LOGIC / INPUT (feature flags)

- `has_complex_business_logic: false` — campaign phases are simple open/success/fail.
- Bounds: zero deposit rejected; constructor rejects zero goal / non-future endTime.
- Double refund prevented by zeroing `deposited` (`testClaimRefundRevertsWhenNothingToRefund`).

## SEC-TEST-004 / 007 — exploit / attack patterns

- Exploits: AccessControl, Reentrancy, Econ, Callback stubs under `test/exploits/`.
- Applicable patterns: AccessControlMissing, ReentrancyClassic. Oracle/Flash/Gov/7702 N/A by features.
