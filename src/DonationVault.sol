// SPDX-License-Identifier: MIT

pragma solidity ^0.8.33;

// =============================================================
// Imports
// =============================================================
// None

/// @title DonationVault
/// @notice Timed ETH donation campaign with a funding goal. Donors can deposit
///         only before `endTime`. After the deadline: if the goal is met the
///         `owner` withdraws the pot; if not, each donor can reclaim their ETH.
/// @dev Per-donor amounts are lifetime contributions for the campaign. They are
///      not rewritten on owner withdraw. Campaign share for a dashboard is
///      `deposited[user] / totalDeposits` (compute off-chain or via a view call).
///      Stray ETH that never entered through `deposit` is not withdrawable.

contract DonationVault {
    // =============================================================
    // Custom errors
    // =============================================================
    // None

    // =============================================================
    // Type declarations
    // =============================================================
    // None

    // =============================================================
    // State variables
    // =============================================================
    address public owner;

    /// @notice Minimum ETH (wei) that must be raised for the campaign to succeed.
    uint256 public goal;

    /// @notice Unix timestamp when deposits close (exclusive: deposit requires `block.timestamp < endTime`).
    uint256 public endTime;

    /// @notice Sum of all amounts that entered via `deposit`. Never reduced.
    uint256 public totalDeposits;

    /// @notice ETH contributed by each address via `deposit`. Zeroed when a refund is claimed.
    mapping(address => uint256) public deposited;

    /// @notice True after the owner has withdrawn a successful campaign pot.
    bool public ownerWithdrawn;

    // =============================================================
    // Events
    // =============================================================
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event Refund(address indexed user, uint256 amount);

    // =============================================================
    // Modifiers
    // =============================================================
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // =============================================================
    // Constructor
    // =============================================================
    /// @param goal_ Minimum wei that must be raised for success.
    /// @param endTime_ Campaign end as a unix timestamp (must be in the future).
    constructor(uint256 goal_, uint256 endTime_) {
        require(goal_ > 0, "Goal is zero");
        require(endTime_ > block.timestamp, "End time not future");
        owner = msg.sender;
        goal = goal_;
        endTime = endTime_;
    }

    // =============================================================
    // External functions
    // =============================================================
    /// @notice Contribute ETH while the campaign is open.
    function deposit() external payable {
        require(block.timestamp < endTime, "Campaign closed");
        require(msg.value > 0, "No ETH sent");

        deposited[msg.sender] += msg.value;
        totalDeposits += msg.value;

        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Owner pulls the full recorded pot after a successful campaign.
    /// @dev Sends exactly `totalDeposits` wei. Extra force-sent ETH stays locked.
    function withdraw() external onlyOwner {
        require(block.timestamp >= endTime, "Campaign open");
        require(totalDeposits >= goal, "Goal not met");
        require(!ownerWithdrawn, "Already withdrawn");

        ownerWithdrawn = true;
        uint256 amount = totalDeposits;

        (bool sent,) = payable(owner).call{value: amount}("");
        require(sent, "ETH transfer failed");

        emit Withdraw(owner, amount);
    }

    /// @notice Donor reclaim after a failed campaign (goal not met by deadline).
    function claimRefund() external {
        require(block.timestamp >= endTime, "Campaign open");
        require(totalDeposits < goal, "Goal met");

        uint256 amount = deposited[msg.sender];
        require(amount > 0, "Nothing to refund");

        deposited[msg.sender] = 0;

        (bool sent,) = payable(msg.sender).call{value: amount}("");
        require(sent, "ETH transfer failed");

        emit Refund(msg.sender, amount);
    }

    // =============================================================
    // Public functions
    // =============================================================
    /// @notice True while new deposits are still accepted.
    function isOpen() public view returns (bool) {
        return block.timestamp < endTime;
    }

    /// @notice True when recorded deposits meet or exceed the goal (independent of time).
    function goalReached() public view returns (bool) {
        return totalDeposits >= goal;
    }

    // =============================================================
    // Receive / fallback
    // =============================================================
    receive() external payable {
        revert("Use deposit()");
    }

    fallback() external payable {
        revert("Use deposit()");
    }

    // =============================================================
    // Internal functions
    // =============================================================
    // None

    // =============================================================
    // Private functions
    // =============================================================
    // None
}
