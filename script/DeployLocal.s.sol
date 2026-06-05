// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NLPoll} from "../src/NLPoll.sol";
import {MockZKPassportVerifier} from "../test/mocks/MockZKPassportVerifier.sol";

/// @notice Deploys NLPoll + the mock verifier to the LOCAL Moonbeam/Moonriver dev node and
///         opens today's poll. For real chains, swap the mock for zkPassport's published
///         verifier address and drop the mock deployment.
contract DeployLocal is Script {
    function run() external {
        vm.startBroadcast();

        MockZKPassportVerifier verifier = new MockZKPassportVerifier();
        NLPoll poll = new NLPoll(verifier);

        bytes32 pollId = keccak256("nl-poll-2026-06-06");
        poll.createPoll(pollId, "Should the Netherlands ban consumer fireworks?", 2); // 0=No, 1=Yes

        vm.stopBroadcast();

        console.log("MockZKPassportVerifier:", address(verifier));
        console.log("NLPoll:                ", address(poll));
        console.log("pollId (scope):");
        console.logBytes32(pollId);
    }
}
