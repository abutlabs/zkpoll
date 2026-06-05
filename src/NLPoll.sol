// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IZKPassportVerifier} from "./IZKPassportVerifier.sol";

/// @title NLPoll — one-question-a-day polling for verified Dutch citizens.
/// @notice The chain IS the database. Eligibility, uniqueness, and the tally are all
///         enforced on-chain. No backend is trusted.
///
/// One-vote-per-poll is a *cryptographic* guarantee, not a promise:
///   nullifier = Poseidon2(passport_chip_data, domain, scope)   (computed in the zkPassport app)
/// By binding `scope = pollId`, each citizen produces exactly one nullifier per poll. The first
/// vote records it; any second attempt yields the *same* number and reverts. Because `scope`
/// changes per poll, nullifiers are also unlinkable across polls.
contract NLPoll {
    /// @dev ISO 3166-1 alpha-3 for the Netherlands; only Dutch citizens may vote.
    bytes3 public constant NLD = bytes3("NLD");

    IZKPassportVerifier public immutable verifier;
    address public owner;

    struct Poll {
        bytes32 id; // also the zkPassport `scope` voters bind their proof to
        string question;
        uint8 numChoices;
        bool exists;
    }

    /// @dev pollId => poll metadata
    mapping(bytes32 => Poll) public polls;
    /// @dev pollId => nullifier => hasVoted. The cryptographic ballot-box.
    mapping(bytes32 => mapping(uint256 => bool)) public usedNullifiers;
    /// @dev pollId => choice => count
    mapping(bytes32 => mapping(uint8 => uint256)) public tally;

    event PollCreated(bytes32 indexed pollId, string question, uint8 numChoices);
    event Voted(bytes32 indexed pollId, uint8 indexed choice);

    error NotOwner();
    error PollAlreadyExists();
    error PollDoesNotExist();
    error InvalidChoice();
    error ProofInvalid();
    error NotDutchCitizen();
    error WrongPoll(); // proof's scope != pollId being voted on
    error AlreadyVoted();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(IZKPassportVerifier _verifier) {
        verifier = _verifier;
        owner = msg.sender;
    }

    /// @notice Open a new daily poll. `pollId` doubles as the zkPassport `scope`.
    function createPoll(bytes32 pollId, string calldata question, uint8 numChoices) external onlyOwner {
        if (polls[pollId].exists) revert PollAlreadyExists();
        if (numChoices < 2) revert InvalidChoice();
        polls[pollId] = Poll({id: pollId, question: question, numChoices: numChoices, exists: true});
        emit PollCreated(pollId, question, numChoices);
    }

    /// @notice Cast a vote. Anyone (e.g. a gasless relayer) may submit; the proof is what
    ///         authenticates the voter, so the submitter cannot forge or alter eligibility.
    /// @dev `choice` should be bound into the proof (zkPassport `.bind(...)`) so a relayer
    ///      cannot flip it. Binding is validated inside `verifier.verify` in the real integration.
    function vote(bytes32 pollId, uint8 choice, bytes calldata proof, bytes calldata publicInputs) external {
        Poll memory poll = polls[pollId];
        if (!poll.exists) revert PollDoesNotExist();
        if (choice >= poll.numChoices) revert InvalidChoice();

        // --- the math ---
        (bool ok, uint256 nullifier, bytes3 nationality, bytes32 scope) = verifier.verify(proof, publicInputs);
        if (!ok) revert ProofInvalid();
        if (nationality != NLD) revert NotDutchCitizen();
        if (scope != pollId) revert WrongPoll(); // proof must be bound to THIS poll

        // --- the ballot-box: one nullifier per (person, poll) ---
        if (usedNullifiers[pollId][nullifier]) revert AlreadyVoted();
        usedNullifiers[pollId][nullifier] = true;

        tally[pollId][choice] += 1;
        emit Voted(pollId, choice);
    }

    /// @notice Read a poll's running tally, trustlessly, straight from chain state.
    function results(bytes32 pollId) external view returns (uint256[] memory counts) {
        Poll memory poll = polls[pollId];
        if (!poll.exists) revert PollDoesNotExist();
        counts = new uint256[](poll.numChoices);
        for (uint8 i = 0; i < poll.numChoices; i++) {
            counts[i] = tally[pollId][i];
        }
    }

    function hasVoted(bytes32 pollId, uint256 nullifier) external view returns (bool) {
        return usedNullifiers[pollId][nullifier];
    }
}
