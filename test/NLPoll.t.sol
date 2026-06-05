// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NLPoll} from "../src/NLPoll.sol";
import {MockZKPassportVerifier} from "./mocks/MockZKPassportVerifier.sol";

contract NLPollTest is Test {
    MockZKPassportVerifier verifier;
    NLPoll poll;

    bytes32 constant POLL_ID = keccak256("nl-poll-2026-06-06");
    bytes3 constant NLD = bytes3("NLD");
    bytes3 constant DEU = bytes3("DEU");

    // Two distinct citizens = two distinct nullifiers for this poll.
    uint256 constant ALICE_NULLIFIER = 0xA11CE;
    uint256 constant BOB_NULLIFIER = 0xB0B;

    address relayer = address(0xBEEF);

    function setUp() public {
        verifier = new MockZKPassportVerifier();
        poll = new NLPoll(verifier);
        poll.createPoll(POLL_ID, "Should the Netherlands ban fireworks?", 2); // 0 = No, 1 = Yes
    }

    /// Build the public-signals blob a valid proof would produce.
    function _signals(bool verified, uint256 nullifier, bytes3 nationality, bytes32 scope)
        internal
        view
        returns (bytes memory)
    {
        return verifier.encode(verified, nullifier, nationality, scope);
    }

    function _voteYes(uint256 nullifier) internal {
        bytes memory sig = _signals(true, nullifier, NLD, POLL_ID);
        vm.prank(relayer); // submitted by a gasless relayer, authenticated by the proof
        poll.vote(POLL_ID, 1, hex"", sig);
    }

    // --- The headline guarantee ---

    function test_DutchCitizenCanVoteOnce() public {
        _voteYes(ALICE_NULLIFIER);
        uint256[] memory counts = poll.results(POLL_ID);
        assertEq(counts[1], 1, "yes count");
        assertEq(counts[0], 0, "no count");
        assertTrue(poll.hasVoted(POLL_ID, ALICE_NULLIFIER));
    }

    /// The same citizen voting twice on the same poll produces the SAME nullifier -> revert.
    function test_RevertWhen_SameCitizenVotesTwice() public {
        _voteYes(ALICE_NULLIFIER); // first vote: accepted

        bytes memory sig = _signals(true, ALICE_NULLIFIER, NLD, POLL_ID);
        vm.prank(relayer);
        vm.expectRevert(NLPoll.AlreadyVoted.selector);
        poll.vote(POLL_ID, 0, hex"", sig); // even switching choice can't dodge the nullifier

        // tally unchanged: still exactly one vote
        uint256[] memory counts = poll.results(POLL_ID);
        assertEq(counts[0] + counts[1], 1, "exactly one vote survives");
    }

    function test_TwoDifferentCitizensBothCount() public {
        _voteYes(ALICE_NULLIFIER);
        _voteYes(BOB_NULLIFIER);
        uint256[] memory counts = poll.results(POLL_ID);
        assertEq(counts[1], 2, "two distinct citizens -> two votes");
    }

    // --- Eligibility & integrity gates ---

    function test_RevertWhen_NotDutchCitizen() public {
        bytes memory sig = _signals(true, 0xC0FFEE, DEU, POLL_ID);
        vm.prank(relayer);
        vm.expectRevert(NLPoll.NotDutchCitizen.selector);
        poll.vote(POLL_ID, 1, hex"", sig);
    }

    function test_RevertWhen_ProofInvalid() public {
        bytes memory sig = _signals(false, ALICE_NULLIFIER, NLD, POLL_ID);
        vm.prank(relayer);
        vm.expectRevert(NLPoll.ProofInvalid.selector);
        poll.vote(POLL_ID, 1, hex"", sig);
    }

    /// A proof bound to a different poll's scope can't be replayed here.
    function test_RevertWhen_ProofBoundToWrongPoll() public {
        bytes32 otherPoll = keccak256("nl-poll-2026-06-05");
        bytes memory sig = _signals(true, ALICE_NULLIFIER, NLD, otherPoll);
        vm.prank(relayer);
        vm.expectRevert(NLPoll.WrongPoll.selector);
        poll.vote(POLL_ID, 1, hex"", sig);
    }

    function test_RevertWhen_ChoiceOutOfRange() public {
        bytes memory sig = _signals(true, ALICE_NULLIFIER, NLD, POLL_ID);
        vm.prank(relayer);
        vm.expectRevert(NLPoll.InvalidChoice.selector);
        poll.vote(POLL_ID, 2, hex"", sig); // only choices 0 and 1 exist
    }

    /// Same human, different day/poll -> different scope -> different nullifier -> can vote again.
    function test_SameCitizenCanVoteOnNextDaysPoll() public {
        _voteYes(ALICE_NULLIFIER);

        bytes32 tomorrow = keccak256("nl-poll-2026-06-07");
        poll.createPoll(tomorrow, "Tomorrow's question?", 2);

        // Real nullifier would differ because scope changed; we model that with a new value.
        uint256 aliceTomorrow = uint256(keccak256(abi.encode(ALICE_NULLIFIER, tomorrow)));
        bytes memory sig = _signals(true, aliceTomorrow, NLD, tomorrow);
        vm.prank(relayer);
        poll.vote(tomorrow, 1, hex"", sig);

        assertEq(poll.results(tomorrow)[1], 1);
    }
}
