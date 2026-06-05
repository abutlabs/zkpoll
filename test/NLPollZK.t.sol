// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NLPollZK} from "../src/NLPollZK.sol";
import {
    IZKPassportVerifier,
    ProofVerificationParams,
    ProofVerificationData,
    ServiceConfig
} from "../src/zkpassport/IZKPassport.sol";
import {MockZKVerifier, MockZKHelper} from "./mocks/MockZKPassport.sol";

contract NLPollZKTest is Test {
    NLPollZK poll;

    string constant DOMAIN = "localhost";
    string constant SCOPE = "nl-poll-2026-06-06";

    bytes32 constant ALICE = bytes32(uint256(0xA11CE));
    bytes32 constant BOB = bytes32(uint256(0xB0B));

    address relayer = address(0xBEEF);

    function setUp() public {
        MockZKHelper helper = new MockZKHelper();
        MockZKVerifier verifier = new MockZKVerifier(helper);
        poll = new NLPollZK(IZKPassportVerifier(address(verifier)), DOMAIN);
        poll.createPoll(SCOPE, 2); // 0 = No, 1 = Yes
    }

    /// Build the params a real proof would yield. `scopeOk`/`isNLD` model the helper checks;
    /// `choice` is the bound custom_data.
    function _params(bool verified, bytes32 nullifier, bool scopeOk, bool isNLD, uint256 chainId, string memory choice)
        internal
        pure
        returns (ProofVerificationParams memory p)
    {
        bytes32[] memory pi = new bytes32[](1);
        pi[0] = scopeOk ? bytes32(uint256(1)) : bytes32(0);
        p.version = bytes32(uint256(1));
        p.proofVerificationData = ProofVerificationData({vkeyHash: bytes32(0), proof: hex"", publicInputs: pi});
        p.committedInputs = abi.encode(verified, nullifier, isNLD, chainId, choice);
        p.serviceConfig =
            ServiceConfig({validityPeriodInSeconds: 7 days, domain: DOMAIN, scope: SCOPE, devMode: false});
    }

    function _voteYes(bytes32 nullifier) internal {
        ProofVerificationParams memory p = _params(true, nullifier, true, true, block.chainid, "1");
        vm.prank(relayer);
        poll.vote(p, SCOPE);
    }

    // --- headline guarantee ---

    function test_DutchCitizenCanVoteOnce() public {
        _voteYes(ALICE);
        uint256[] memory c = poll.results(SCOPE);
        assertEq(c[1], 1, "yes");
        assertEq(c[0], 0, "no");
        assertTrue(poll.hasVoted(SCOPE, ALICE));
    }

    function test_RevertWhen_SameCitizenVotesTwice() public {
        _voteYes(ALICE);
        // Same nullifier, even switching choice to No -> rejected.
        ProofVerificationParams memory p = _params(true, ALICE, true, true, block.chainid, "0");
        vm.prank(relayer);
        vm.expectRevert(NLPollZK.AlreadyVoted.selector);
        poll.vote(p, SCOPE);
        uint256[] memory c = poll.results(SCOPE);
        assertEq(c[0] + c[1], 1, "exactly one vote survives");
    }

    function test_TwoDifferentCitizensBothCount() public {
        _voteYes(ALICE);
        _voteYes(BOB);
        assertEq(poll.results(SCOPE)[1], 2);
    }

    // --- gates ---

    function test_RevertWhen_ProofInvalid() public {
        ProofVerificationParams memory p = _params(false, ALICE, true, true, block.chainid, "1");
        vm.prank(relayer);
        vm.expectRevert(NLPollZK.ProofInvalid.selector);
        poll.vote(p, SCOPE);
    }

    function test_RevertWhen_WrongScope() public {
        ProofVerificationParams memory p = _params(true, ALICE, false, true, block.chainid, "1");
        vm.prank(relayer);
        vm.expectRevert(NLPollZK.InvalidScope.selector);
        poll.vote(p, SCOPE);
    }

    function test_RevertWhen_NotDutchCitizen() public {
        ProofVerificationParams memory p = _params(true, ALICE, true, false, block.chainid, "1");
        vm.prank(relayer);
        vm.expectRevert(NLPollZK.NotDutchCitizen.selector);
        poll.vote(p, SCOPE);
    }

    function test_RevertWhen_WrongChain() public {
        ProofVerificationParams memory p = _params(true, ALICE, true, true, 999, "1");
        vm.prank(relayer);
        vm.expectRevert(NLPollZK.WrongChain.selector);
        poll.vote(p, SCOPE);
    }

    function test_RevertWhen_ChoiceOutOfRange() public {
        // custom_data "5" is not a valid choice for a 2-option poll.
        ProofVerificationParams memory p = _params(true, ALICE, true, true, block.chainid, "5");
        vm.prank(relayer);
        vm.expectRevert(NLPollZK.InvalidChoice.selector);
        poll.vote(p, SCOPE);
    }

    function test_RevertWhen_PollDoesNotExist() public {
        ProofVerificationParams memory p = _params(true, ALICE, true, true, block.chainid, "1");
        vm.prank(relayer);
        vm.expectRevert(NLPollZK.PollDoesNotExist.selector);
        poll.vote(p, "nonexistent-poll");
    }
}
