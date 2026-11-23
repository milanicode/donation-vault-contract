# Testing Guide (DonationVault)

This file explains the unit tests in `test/DonationVault.t.sol` in beginner-friendly language.

## Quick start

From the `donation-vault-contract` directory:

```bash
forge test
```

Useful variants:

```bash
forge test -vv
forge test --match-test testWithdrawSucceedsAfterGoalMetAndEmitsEvent -vv
```

## Campaign rules under test

Default fixture in `setUp()`:

- `goal = 3 ether`
- `endTime = now + 7 days`
- deployer is `owner`

## What each area validates

### Constructor / views

- Deployer becomes `owner`.
- `goal`, `endTime`, empty `totalDeposits` / `deposited`, `isOpen() == true`.
- Reverts when `goal == 0` or `endTime` is not in the future.

### Deposit

- Zero-value deposit reverts (`No ETH sent`).
- Deposit after `endTime` reverts (`Campaign closed`).
- Repeated deposits accumulate in `deposited[user]` and `totalDeposits`.
- `Deposit` event is emitted.
- Plain ETH transfer (`receive`) is rejected (`Use deposit()`).
- Fuzz: random non-zero amounts keep accounting aligned with the contract balance.

### Successful campaign (goal met)

Helper `_fundSuccessfulCampaign()` deposits 2 + 1 ETH, then warps to `endTime`.

- Non-owner `withdraw` reverts.
- `withdraw` before deadline reverts (`Campaign open`).
- After success: owner `withdraw` sends exactly `totalDeposits`, sets `ownerWithdrawn`, keeps contribution records for reporting, emits `Withdraw`.
- Second `withdraw` reverts (`Already withdrawn`).
- Stray ETH above `totalDeposits` is not sent to the owner.
- Failed ETH transfer to owner reverts (`ETH transfer failed`).
- `claimRefund` reverts when the goal was met.

### Failed campaign (goal missed)

Helper `_fundFailedCampaign()` deposits 1 + 1 ETH (< 3 ETH goal), then warps.

- `claimRefund` before deadline reverts.
- Each donor can reclaim their own amount once; `Refund` is emitted; `deposited` is zeroed.
- Caller with no deposit / double claim reverts (`Nothing to refund`).
- Owner `withdraw` reverts (`Goal not met`).
- Fuzz: random under-goal amounts still fully refund.

## Common mistakes while running tests

- Running commands from the wrong directory.
  - Fix: `cd donation-vault-contract`.
- Missing dependencies/submodules.
  - Fix: `git submodule update --init --recursive`.
- Expecting wei/ether values to match without conversion.
  - Remember: `1 ether = 1e18 wei`.
- Forgetting that deposits close at `endTime` — warp with `vm.warp(vault.endTime())` before withdraw/refund tests.

## Also in this repo

- Stateful invariants: `test/Invariants.t.sol`
- Exploit regressions: `test/exploits/AccessControl.t.sol`, `test/exploits/Reentrancy.t.sol`

## Good portfolio habit

Before each commit:

```bash
forge fmt
forge test
```

