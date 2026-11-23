// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {DonationVault} from "../src/DonationVault.sol";

contract DonationVaultHandler is Test {
    DonationVault public vault;
    address public owner;
    address public alice;
    address public bob;
    address public carol;

    bool public ended;

    constructor(DonationVault vault_, address owner_) {
        vault = vault_;
        owner = owner_;
        alice = makeAddr("inv-alice");
        bob = makeAddr("inv-bob");
        carol = makeAddr("inv-carol");
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    function deposit(uint256 actorSeed, uint256 amount) external {
        if (block.timestamp >= vault.endTime()) return;

        address actor = _actor(actorSeed);
        amount = bound(amount, 1, 5 ether);
        if (actor.balance < amount) {
            vm.deal(actor, amount);
        }

        vm.prank(actor);
        vault.deposit{value: amount}();
    }

    function warpPastEnd() external {
        if (ended) return;
        ended = true;
        vm.warp(vault.endTime());
    }

    function withdraw() external {
        if (block.timestamp < vault.endTime()) return;
        if (vault.totalDeposits() < vault.goal()) return;
        if (vault.ownerWithdrawn()) return;

        vm.prank(owner);
        vault.withdraw();
    }

    function claimRefund(uint256 actorSeed) external {
        if (block.timestamp < vault.endTime()) return;
        if (vault.totalDeposits() >= vault.goal()) return;

        address actor = _actor(actorSeed);
        if (vault.deposited(actor) == 0) return;

        vm.prank(actor);
        vault.claimRefund();
    }

    function _actor(uint256 seed) internal view returns (address) {
        uint256 i = seed % 3;
        if (i == 0) return alice;
        if (i == 1) return bob;
        return carol;
    }
}

contract DonationVaultInvariants is Test {
    uint256 internal constant GOAL = 3 ether;
    uint256 internal constant DURATION = 7 days;

    DonationVault internal vault;
    DonationVaultHandler internal handler;

    function setUp() public {
        vault = new DonationVault(GOAL, block.timestamp + DURATION);
        handler = new DonationVaultHandler(vault, address(this));
        targetContract(address(handler));
    }

    receive() external payable {}

    /// @dev While the owner has not taken a successful pot, claimable ETH must still be in the contract.
    function invariant_claimableFundsCovered() public view {
        if (vault.ownerWithdrawn()) return;

        uint256 outstanding =
            vault.deposited(handler.alice()) + vault.deposited(handler.bob()) + vault.deposited(handler.carol());
        assertGe(address(vault).balance, outstanding);
    }

    /// @dev Refunds can lower outstanding deposits, but never above the lifetime raised total.
    function invariant_outstandingNeverExceedsTotalDeposits() public view {
        uint256 outstanding =
            vault.deposited(handler.alice()) + vault.deposited(handler.bob()) + vault.deposited(handler.carol());
        assertLe(outstanding, vault.totalDeposits());
    }

    /// @dev Owner withdraw is only possible on a successful campaign.
    function invariant_ownerWithdrawnImpliesGoalMet() public view {
        if (vault.ownerWithdrawn()) {
            assertGe(vault.totalDeposits(), vault.goal());
        }
    }
}
