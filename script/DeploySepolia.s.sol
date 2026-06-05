// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NLPollZK} from "../src/NLPollZK.sol";
import {IZKPassportVerifier} from "../src/zkpassport/IZKPassport.sol";

/// @notice Deploys NLPollZK to a network where zkPassport's verifier + registry are live
///         (Sepolia/Mainnet/Base) and opens the first poll. Reads DOMAIN/SCOPE from env.
contract DeploySepolia is Script {
    // Deterministic ZKPassport verifier — same address on Sepolia, Mainnet, and Base.
    address constant ZKPASSPORT_VERIFIER = 0x1D000001000EFD9a6371f4d90bB8920D5431c0D8;

    function run() external {
        // The domain MUST match the one the frontend's `new ZKPassport(domain)` uses.
        string memory domain = vm.envOr("DOMAIN", string("localhost"));
        string memory scope = vm.envOr("SCOPE", string("nl-poll-2026-06-06"));
        string memory question = vm.envOr("QUESTION", string("Should the Netherlands ban consumer fireworks?"));

        vm.startBroadcast();
        NLPollZK poll = new NLPollZK(IZKPassportVerifier(ZKPASSPORT_VERIFIER), domain);
        bytes32 pollKey = poll.createPoll(scope, 2); // 0 = No, 1 = Yes
        vm.stopBroadcast();

        console.log("NLPollZK:  ", address(poll));
        console.log("verifier:  ", ZKPASSPORT_VERIFIER);
        console.log("domain:    ", domain);
        console.log("scope:     ", scope);
        console.log("question:  ", question);

        string memory o = "sepolia";
        vm.serializeAddress(o, "nlPollZK", address(poll));
        vm.serializeAddress(o, "verifier", ZKPASSPORT_VERIFIER);
        vm.serializeString(o, "domain", domain);
        vm.serializeString(o, "question", question);
        vm.serializeUint(o, "chainId", block.chainid);
        vm.serializeBytes32(o, "pollKey", pollKey);
        string memory out = vm.serializeString(o, "scope", scope);
        vm.writeJson(out, "./deployments.sepolia.json");
    }
}
