// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {
    IZKPassportVerifier,
    IZKPassportHelper,
    ProofVerificationParams,
    DisclosedData,
    BoundData
} from "../../src/zkpassport/IZKPassport.sol";

/// @notice Test doubles for zkPassport's deployed verifier + helper, so NLPollZK's logic
///         (scope/nationality/chain/choice gating + nullifier dedup) can be unit-tested
///         without real ZK proofs. The test encodes the signals a real proof would surface
///         into `committedInputs`, and a scope-OK flag into `publicInputs[0]`.
///
/// committedInputs layout (abi.encode): (bool verified, bytes32 nullifier, bool isNLD,
///                                       uint256 chainId, string customData)
contract MockZKHelper is IZKPassportHelper {
    function _decode(bytes calldata committed)
        internal
        pure
        returns (bool verified, bytes32 nullifier, bool isNLD, uint256 chainId, string memory customData)
    {
        return abi.decode(committed, (bool, bytes32, bool, uint256, string));
    }

    function verifyScopes(bytes32[] calldata publicInputs, string calldata, string calldata)
        external
        pure
        returns (bool)
    {
        return publicInputs.length > 0 && publicInputs[0] == bytes32(uint256(1));
    }

    function isNationalityIn(string[] memory, bytes calldata committed) external pure returns (bool) {
        (,, bool isNLD,,) = _decode(committed);
        return isNLD;
    }

    function getBoundData(bytes calldata committed) external pure returns (BoundData memory) {
        (,,, uint256 chainId, string memory customData) = _decode(committed);
        return BoundData({senderAddress: address(0), chainId: chainId, customData: customData});
    }

    function getDisclosedData(bytes calldata, bool) external pure returns (DisclosedData memory d) {
        d.nationality = "NLD";
    }

    function isAgeAboveOrEqual(uint8, bytes calldata) external pure returns (bool) {
        return true;
    }

    function getProofTimestamp(bytes32[] calldata) external pure returns (uint256) {
        return 0;
    }
}

contract MockZKVerifier is IZKPassportVerifier {
    IZKPassportHelper public immutable helper;

    constructor(IZKPassportHelper _helper) {
        helper = _helper;
    }

    function verify(ProofVerificationParams calldata params)
        external
        view
        returns (bool verified, bytes32 uniqueIdentifier, IZKPassportHelper)
    {
        (verified, uniqueIdentifier,,,) =
            abi.decode(params.committedInputs, (bool, bytes32, bool, uint256, string));
        return (verified, uniqueIdentifier, helper);
    }
}
