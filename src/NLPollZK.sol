// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {
    IZKPassportVerifier,
    IZKPassportHelper,
    ProofVerificationParams,
    DisclosedData,
    BoundData
} from "./zkpassport/IZKPassport.sol";

/// @title NLPollZK — daily polling for verified Dutch citizens, REAL zkPassport proofs on-chain.
/// @notice The production sibling of NLPoll.sol (which uses a mock verifier for the local demo).
///         Here votes are gated by genuine zkPassport proofs verified by the deployed
///         ZKPassport verifier, against the on-chain ICAO certificate registry.
///
/// One-vote-per-poll is cryptographic: the verifier returns a `uniqueIdentifier` (nullifier)
/// that is stable per (passport, domain, scope). With `scope = pollId`, each citizen yields
/// exactly one nullifier per poll; the first vote records it, any second attempt reverts.
///
/// Gasless-relayer safe: the vote choice is BOUND into the proof (`custom_data`), so the
/// relayer that submits the tx cannot alter it. We therefore do NOT require
/// `boundData.senderAddress == msg.sender` (the submitter is the relayer, not the voter).
contract NLPollZK {
    /// Deterministic ZKPassport verifier address — identical on Sepolia, Mainnet, and Base.
    IZKPassportVerifier public immutable verifier;

    /// The domain the zkPassport SDK is instantiated with; must match the proof's scope hash.
    string public domain;
    address public owner;

    /// How recent the proof's ID-expiry check must be (seconds). Mirrors SDK `validity`.
    uint256 public constant VALIDITY_PERIOD = 7 days;

    struct Poll {
        string scope; // the SDK `scope` string voters bind to; also the poll's identity
        uint8 numChoices;
        bool exists;
    }

    /// @dev pollKey = keccak256(scope)
    mapping(bytes32 => Poll) public polls;
    /// @dev pollKey => nullifier => voted. The cryptographic ballot-box.
    mapping(bytes32 => mapping(bytes32 => bool)) public usedNullifiers;
    /// @dev pollKey => choice => count
    mapping(bytes32 => mapping(uint8 => uint256)) public tally;

    event PollCreated(bytes32 indexed pollKey, string scope, uint8 numChoices);
    event Voted(bytes32 indexed pollKey, uint8 indexed choice);

    error NotOwner();
    error PollAlreadyExists();
    error PollDoesNotExist();
    error InvalidChoice();
    error ProofInvalid();
    error InvalidScope();
    error NotDutchCitizen();
    error WrongChain();
    error AlreadyVoted();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @param _verifier the deployed ZKPassport verifier (0x1D000001000EFD9a6371f4d90bB8920D5431c0D8).
    /// @param _domain   the exact domain string the frontend's `new ZKPassport(domain)` uses.
    constructor(IZKPassportVerifier _verifier, string memory _domain) {
        verifier = _verifier;
        domain = _domain;
        owner = msg.sender;
    }

    function setDomain(string calldata _domain) external onlyOwner {
        domain = _domain;
    }

    /// @notice Open a poll. `scope` doubles as the zkPassport SDK scope voters bind their proof to.
    function createPoll(string calldata scope, uint8 numChoices) external onlyOwner returns (bytes32 pollKey) {
        if (numChoices < 2) revert InvalidChoice();
        pollKey = keccak256(bytes(scope));
        if (polls[pollKey].exists) revert PollAlreadyExists();
        polls[pollKey] = Poll({scope: scope, numChoices: numChoices, exists: true});
        emit PollCreated(pollKey, scope, numChoices);
    }

    /// @notice Cast a vote with a real zkPassport proof. Any submitter may relay it; the proof
    ///         authenticates the voter and the bound `custom_data` fixes the choice.
    /// @param params   built by the SDK's `getSolidityVerifierParameters(...)`.
    /// @param scope    the poll's scope string (must match the proof and an open poll).
    /// @param isIDCard true if the document is an ID card / residence permit (TD1), false for a passport (TD3).
    function vote(ProofVerificationParams calldata params, string calldata scope, bool isIDCard) external {
        bytes32 pollKey = keccak256(bytes(scope));
        Poll memory poll = polls[pollKey];
        if (!poll.exists) revert PollDoesNotExist();

        // --- the math: verify the proof against the on-chain certificate registry ---
        (bool ok, bytes32 nullifier, IZKPassportHelper helper) = verifier.verify(params);
        if (!ok) revert ProofInvalid();

        bytes32[] calldata publicInputs = params.proofVerificationData.publicInputs;
        bytes calldata committed = params.committedInputs;

        // Proof must be bound to OUR domain and THIS poll's scope.
        if (!helper.verifyScopes(publicInputs, domain, scope)) revert InvalidScope();

        // Eligibility: Dutch citizen. isNationalityIn proves membership without disclosing more.
        string[] memory nld = new string[](1);
        nld[0] = "NLD";
        if (!helper.isNationalityIn(nld, committed)) revert NotDutchCitizen();

        // The vote choice is bound into the proof; the relayer cannot tamper with it.
        BoundData memory bound = helper.getBoundData(committed);
        if (bound.chainId != block.chainid) revert WrongChain();
        uint8 choice = _parseChoice(bound.customData);
        if (choice >= poll.numChoices) revert InvalidChoice();

        // --- the ballot-box: one nullifier per (citizen, poll) ---
        if (usedNullifiers[pollKey][nullifier]) revert AlreadyVoted();
        usedNullifiers[pollKey][nullifier] = true;

        tally[pollKey][choice] += 1;
        emit Voted(pollKey, choice);
    }

    function results(string calldata scope) external view returns (uint256[] memory counts) {
        bytes32 pollKey = keccak256(bytes(scope));
        Poll memory poll = polls[pollKey];
        if (!poll.exists) revert PollDoesNotExist();
        counts = new uint256[](poll.numChoices);
        for (uint8 i = 0; i < poll.numChoices; i++) {
            counts[i] = tally[pollKey][i];
        }
    }

    function hasVoted(string calldata scope, bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[keccak256(bytes(scope))][nullifier];
    }

    /// @dev The choice is bound as a single ASCII digit ("0".."9") in custom_data.
    function _parseChoice(string memory customData) internal pure returns (uint8) {
        bytes memory b = bytes(customData);
        if (b.length != 1) revert InvalidChoice();
        uint8 c = uint8(b[0]);
        if (c < 0x30 || c > 0x39) revert InvalidChoice(); // '0'..'9'
        return c - 0x30;
    }
}
