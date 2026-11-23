# Security analysis notes — donation-vault (agent:cursor)
# Used as --analysis evidence for hybrid checks.

## SEC-PROC-004 / assumptions cross-check
Reviewed ASSUMPTIONS.md and TRUST-MODEL.md against DonationVault.sol:
owner-gated withdraw, proportional mulDiv accounting, checked ETH call,
unbounded depositors loop (DoS), forced ETH not withdrawable beyond totalDeposits.

## SEC-ACCESS-001 — privileged function inventory
- `deposit()` — open by design (any address, msg.value > 0). src/DonationVault.sol:62
- `withdraw(uint256)` — restricted `onlyOwner`. src/DonationVault.sol:73
No other external/public state-changing functions.

## SEC-ACCESS-002 / 003 / 006 / 007
- Owner is immutable (constructor only); no role rotation path — accepted for demo (ASSUMPTIONS).
- No pause, rescue, or sweep functions present.
- Only privileged setter-equivalent is withdraw itself (already gated).

## SEC-REENT-001 / 002 — external call sites
- Single external call: `payable(msg.sender).call{value: amount}("")` at
  src/DonationVault.sol:102 AFTER totalDeposits and balances updates (CEI).
- Cross-function: deposit does not call out; reentering withdraw after CEI
  should hit reduced totalDeposits / balance checks.
- Exploit regression: test/exploits/Reentrancy.t.sol

## SEC-EXT-002 / 005 — call handling
- Low-level call success checked with `require(sent, "ETH transfer failed")`.
- Uses `call` not `transfer`/`send`.

## SEC-MATH-001 / 005 / 006 — rounding
- Proportional shrink uses OpenZeppelin Math.mulDiv; dust assigned to
  depositors[0] so sum(balances) == newTotal (src/DonationVault.sol:91-98).
- Fuzz: testFuzzWithdrawPreservesAccountingAndBalance,
  testFuzzDepositTracksAccounting; invariants cover sum identity.

## SEC-LOGIC-001 / 002 / 003
- Requirements REQ-001..005 linked to INV-001..003 and unit/invariant/exploit tests.
- No multi-phase state machine beyond deposit/withdraw accounting.

## SEC-DOS-001 / 002 — loops
- `withdraw` iterates `depositors` unbounded (src/DonationVault.sol:85-93).
- Attacker can grow the set via many depositors → gas DoS on withdraw.
- Severity medium; documented in threat model THR-004.
- Withdraw is pull-to-owner (single recipient), not push-to-all-users.

## SEC-ECON-001 — flashloan amplification
- No oracle/pricing; flashloan capital only increases deposit weight.
- Owner still sole withdrawer. Economic risk is owner trust + DoS, not
  flashloan price manipulation. Accepted for this design.

## SEC-TEST-004 / 007 — exploit / attack patterns
- Exploits present: AccessControl, Reentrancy.
- Applicable attack-patterns considered: AccessControlMissing, ReentrancyClassic,
  PrecisionLoss (rounding dust handled). Oracle/Flash/Gov/7702 N/A by features.

## SEC-INPUT-003 / 004
- deposit rejects zero value; withdraw bounds amount vs balance and totalDeposits.
- No user-supplied arrays on external API.
