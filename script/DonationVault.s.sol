// SPDX-License-Identifier: MIT

pragma solidity ^0.8.33;

import {Script} from "forge-std/Script.sol";
import {DonationVault} from "../src/DonationVault.sol";

contract DonationVaultScript is Script {
    function run() external {
        uint256 goal = vm.envOr("CAMPAIGN_GOAL", uint256(1 ether));
        uint256 duration = vm.envOr("CAMPAIGN_DURATION", uint256(7 days));

        vm.startBroadcast();
        new DonationVault(goal, block.timestamp + duration);
        vm.stopBroadcast();
    }
}
