// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.21;

// Minimal vendored interfaces + structs for zkPassport's deployed on-chain verifier.
// We don't need the verifier's implementation — it's already deployed at a deterministic
// address on every network (Sepolia/Mainnet/Base): 0x1D000001000EFD9a6371f4d90bB8920D5431c0D8.
// Definitions copied verbatim from the zkPassport docs (getting-started/onchain.md) and
// trimmed to the helper methods this project uses.

/// @notice Data bound into a proof via the SDK `.bind(...)` (tamper-proof, signed by the proof).
struct BoundData {
    address senderAddress; // bind("user_address")
    uint256 chainId; // bind("chain")
    string customData; // bind("custom_data") — we put the vote choice here
}

/// @notice Data selectively disclosed by a proof.
struct DisclosedData {
    string name;
    string issuingCountry;
    string nationality; // raw MRZ alpha-3 (e.g. "NLD"; note Germany renders as "D<<")
    string gender;
    string birthDate;
    string expiryDate;
    string documentNumber;
    string documentType;
}

struct ProofVerificationData {
    bytes32 vkeyHash;
    bytes proof;
    bytes32[] publicInputs;
}

struct ServiceConfig {
    uint256 validityPeriodInSeconds;
    string domain;
    string scope;
    bool devMode;
}

struct ProofVerificationParams {
    bytes32 version;
    ProofVerificationData proofVerificationData;
    bytes committedInputs;
    ServiceConfig serviceConfig;
}

/// @notice The deployed ZKPassport verifier. Verifies the proof against the on-chain
///         certificate/circuit registries and returns the nullifier + a helper for reading
///         disclosed/bound data.
interface IZKPassportVerifier {
    function verify(ProofVerificationParams calldata params)
        external
        returns (bool verified, bytes32 uniqueIdentifier, IZKPassportHelper helper);
}

/// @notice Helper (returned by verify) for asserting conditions and decoding committed inputs.
interface IZKPassportHelper {
    /// @param domain the domain the SDK was instantiated with; @param scope the SDK `scope` string.
    function verifyScopes(bytes32[] calldata publicInputs, string calldata domain, string calldata scope)
        external
        pure
        returns (bool);

    function getDisclosedData(bytes calldata committedInputs, bool isIDCard)
        external
        pure
        returns (DisclosedData memory);

    function getBoundData(bytes calldata committedInputs) external pure returns (BoundData memory);

    function isNationalityIn(string[] memory countryList, bytes calldata committedInputs)
        external
        pure
        returns (bool);

    function isAgeAboveOrEqual(uint8 minAge, bytes calldata committedInputs) external pure returns (bool);

    function getProofTimestamp(bytes32[] calldata publicInputs) external pure returns (uint256);
}
