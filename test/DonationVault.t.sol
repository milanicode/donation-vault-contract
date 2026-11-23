// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {DonationVault} from "../src/DonationVault.sol";

contract DonationVaultTest is Test {
    DonationVault internal vault;

    address internal alice;
    address internal bob;
    address internal charlie;

    uint256 internal constant GOAL = 3 ether;
    uint256 internal constant DURATION = 7 days;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event Refund(address indexed user, uint256 amount);

    receive() external payable {}

    function setUp() public {
        vault = new DonationVault(GOAL, block.timestamp + DURATION);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
    }

    // -------------------------------------------------------------
    // Initial state and view functions
    // -------------------------------------------------------------

    function testOwnerIsDeployer() public view {
        assertEq(vault.owner(), address(this));
    }

    function testInitialViewState() public view {
        assertEq(vault.goal(), GOAL);
        assertEq(vault.endTime(), block.timestamp + DURATION);
        assertEq(vault.totalDeposits(), 0);
        assertEq(vault.deposited(alice), 0);
        assertTrue(vault.isOpen());
        assertFalse(vault.goalReached());
        assertFalse(vault.ownerWithdrawn());
    }

    function testConstructorRevertsWhenGoalIsZero() public {
        vm.expectRevert("Goal is zero");
        new DonationVault(0, block.timestamp + DURATION);
    }

    function testConstructorRevertsWhenEndTimeNotFuture() public {
        vm.expectRevert("End time not future");
        new DonationVault(GOAL, block.timestamp);
    }

    // -------------------------------------------------------------
    // Deposit
    // -------------------------------------------------------------

    function testDepositRevertsWhenValueIsZero() public {
        vm.expectRevert("No ETH sent");
        vault.deposit{value: 0}();
    }

    function testDepositRevertsWhenCampaignClosed() public {
        vm.warp(vault.endTime());
        vm.deal(alice, 1 ether);

        vm.prank(alice);
        vm.expectRevert("Campaign closed");
        vault.deposit{value: 1 ether}();
    }

    function testDepositTracksUserAndTotalDeposits() public {
        vm.deal(alice, 2 ether);

        vm.startPrank(alice);
        vault.deposit{value: 1 ether}();
        vault.deposit{value: 0.5 ether}();
        vm.stopPrank();

        assertEq(vault.deposited(alice), 1.5 ether);
        assertEq(vault.totalDeposits(), 1.5 ether);
        assertFalse(vault.goalReached());
    }

    function testDepositEmitsEvent() public {
        vm.deal(alice, 1 ether);

        vm.expectEmit(true, false, false, true);
        emit Deposit(alice, 1 ether);

        vm.prank(alice);
        vault.deposit{value: 1 ether}();
    }

    function testReceiveReverts() public {
        vm.deal(alice, 1 ether);
        uint256 vaultBefore = address(vault).balance;

        vm.prank(alice);
        (bool ok,) = address(vault).call{value: 1 ether}("");

        assertFalse(ok);
        assertEq(address(vault).balance, vaultBefore);
        assertEq(vault.totalDeposits(), 0);
    }

    function testFuzz_DepositTracksAccounting(uint96 amount) public {
        vm.assume(amount > 0);

        vm.deal(alice, amount);
        vm.prank(alice);
        vault.deposit{value: amount}();

        assertEq(vault.deposited(alice), amount);
        assertEq(vault.totalDeposits(), amount);
        assertEq(address(vault).balance, amount);
    }

    // -------------------------------------------------------------
    // Successful campaign — owner withdraw
    // -------------------------------------------------------------

    function _fundSuccessfulCampaign() internal {
        vm.deal(alice, 2 ether);
        vm.deal(bob, 1 ether);

        vm.prank(alice);
        vault.deposit{value: 2 ether}();
        vm.prank(bob);
        vault.deposit{value: 1 ether}();

        assertTrue(vault.goalReached());
        vm.warp(vault.endTime());
    }

    function testWithdrawRevertsForNonOwner() public {
        _fundSuccessfulCampaign();

        vm.prank(bob);
        vm.expectRevert("Not owner");
        vault.withdraw();
    }

    function testWithdrawRevertsWhileCampaignOpen() public {
        vm.deal(alice, 3 ether);
        vm.prank(alice);
        vault.deposit{value: 3 ether}();

        vm.expectRevert("Campaign open");
        vault.withdraw();
    }

    function testWithdrawRevertsWhenGoalNotMet() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vault.deposit{value: 1 ether}();

        vm.warp(vault.endTime());
        vm.expectRevert("Goal not met");
        vault.withdraw();
    }

    function testWithdrawSucceedsAfterGoalMetAndEmitsEvent() public {
        _fundSuccessfulCampaign();

        uint256 ownerBalanceBefore = address(this).balance;

        vm.expectEmit(true, false, false, true);
        emit Withdraw(address(this), 3 ether);
        vault.withdraw();

        assertTrue(vault.ownerWithdrawn());
        assertEq(vault.totalDeposits(), 3 ether); // raised total stays for reporting
        assertEq(vault.deposited(alice), 2 ether);
        assertEq(vault.deposited(bob), 1 ether);
        assertEq(address(vault).balance, 0);
        assertEq(address(this).balance, ownerBalanceBefore + 3 ether);
    }

    function testWithdrawRevertsWhenAlreadyWithdrawn() public {
        _fundSuccessfulCampaign();
        vault.withdraw();

        vm.expectRevert("Already withdrawn");
        vault.withdraw();
    }

    function testWithdrawLeavesStrayEthAndOnlySendsRecordedTotal() public {
        _fundSuccessfulCampaign();

        // Force-credit extra ETH without going through deposit accounting.
        vm.deal(address(vault), address(vault).balance + 1 ether);
        assertEq(address(vault).balance, 4 ether);
        assertEq(vault.totalDeposits(), 3 ether);

        uint256 ownerBefore = address(this).balance;
        vault.withdraw();

        assertEq(address(this).balance, ownerBefore + 3 ether); // only recorded deposits
        assertEq(address(vault).balance, 1 ether); // stray ETH remains locked
    }

    function testWithdrawRevertsWhenOwnerCannotReceiveEth() public {
        address ownerAddr = makeAddr("ownerCannotReceive");

        vm.prank(ownerAddr);
        DonationVault customVault = new DonationVault(GOAL, block.timestamp + DURATION);

        vm.deal(charlie, 3 ether);
        vm.prank(charlie);
        customVault.deposit{value: 3 ether}();

        vm.warp(customVault.endTime());
        vm.etch(ownerAddr, hex"60006000fd");

        vm.prank(ownerAddr);
        vm.expectRevert("ETH transfer failed");
        customVault.withdraw();
    }

    function testClaimRefundRevertsWhenGoalMet() public {
        _fundSuccessfulCampaign();

        vm.prank(alice);
        vm.expectRevert("Goal met");
        vault.claimRefund();
    }

    // -------------------------------------------------------------
    // Failed campaign — donor refunds
    // -------------------------------------------------------------

    function _fundFailedCampaign() internal {
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);

        vm.prank(alice);
        vault.deposit{value: 1 ether}();
        vm.prank(bob);
        vault.deposit{value: 1 ether}();

        assertFalse(vault.goalReached());
        vm.warp(vault.endTime());
    }

    function testClaimRefundRevertsWhileCampaignOpen() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vault.deposit{value: 1 ether}();

        vm.prank(alice);
        vm.expectRevert("Campaign open");
        vault.claimRefund();
    }

    function testClaimRefundSucceedsAfterFailedCampaign() public {
        _fundFailedCampaign();

        uint256 aliceBefore = alice.balance;

        vm.expectEmit(true, false, false, true);
        emit Refund(alice, 1 ether);
        vm.prank(alice);
        vault.claimRefund();

        assertEq(vault.deposited(alice), 0);
        assertEq(alice.balance, aliceBefore + 1 ether);
        assertEq(vault.deposited(bob), 1 ether);
        assertEq(vault.totalDeposits(), 2 ether);
    }

    function testClaimRefundRevertsWhenNothingToRefund() public {
        _fundFailedCampaign();

        vm.prank(alice);
        vault.claimRefund();

        vm.prank(alice);
        vm.expectRevert("Nothing to refund");
        vault.claimRefund();
    }

    function testClaimRefundRevertsWhenCallerNeverDeposited() public {
        _fundFailedCampaign();

        vm.prank(charlie);
        vm.expectRevert("Nothing to refund");
        vault.claimRefund();
    }

    function testWithdrawRevertsOnFailedCampaign() public {
        _fundFailedCampaign();

        vm.expectRevert("Goal not met");
        vault.withdraw();
    }

    function testBothDonorsCanRefundIndependently() public {
        _fundFailedCampaign();

        vm.prank(alice);
        vault.claimRefund();
        vm.prank(bob);
        vault.claimRefund();

        assertEq(address(vault).balance, 0);
        assertEq(vault.deposited(alice), 0);
        assertEq(vault.deposited(bob), 0);
    }

    function testFuzz_SuccessfulCampaignWithdraw(uint96 amountAlice, uint96 amountBob) public {
        uint256 a = bound(uint256(amountAlice), 1, type(uint96).max / 2);
        uint256 b = bound(uint256(amountBob), 1, type(uint96).max / 2);
        vm.assume(a + b >= GOAL);

        DonationVault localVault = new DonationVault(GOAL, block.timestamp + DURATION);

        vm.deal(alice, a);
        vm.deal(bob, b);
        vm.prank(alice);
        localVault.deposit{value: a}();
        vm.prank(bob);
        localVault.deposit{value: b}();

        vm.warp(localVault.endTime());

        uint256 ownerBefore = address(this).balance;
        localVault.withdraw();

        assertEq(address(this).balance, ownerBefore + a + b);
        assertTrue(localVault.ownerWithdrawn());
    }

    function testFuzz_FailedCampaignRefund(uint96 amountAlice, uint96 amountBob) public {
        uint256 a = bound(uint256(amountAlice), 1, GOAL - 1);
        uint256 b = bound(uint256(amountBob), 0, GOAL - 1 - a);
        // a + b < GOAL always here when b can be 0; if b==0 only alice deposited

        DonationVault localVault = new DonationVault(GOAL, block.timestamp + DURATION);

        vm.deal(alice, a);
        vm.prank(alice);
        localVault.deposit{value: a}();

        if (b > 0) {
            vm.deal(bob, b);
            vm.prank(bob);
            localVault.deposit{value: b}();
        }

        assertTrue(localVault.totalDeposits() < GOAL);
        vm.warp(localVault.endTime());

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        localVault.claimRefund();
        assertEq(alice.balance, aliceBefore + a);

        if (b > 0) {
            uint256 bobBefore = bob.balance;
            vm.prank(bob);
            localVault.claimRefund();
            assertEq(bob.balance, bobBefore + b);
        }

        assertEq(address(localVault).balance, 0);
    }
}
