// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IZKPassportVerifier} from "../../src/IZKPassportVerifier.sol";

/// @notice Test double for the zkPassport verifier.
/// @dev We don't have real ZK proofs in unit tests, so the mock simply decodes the
///      public signals the real verifier *would* extract from a valid proof. This lets
///      us drive every poll-logic scenario (valid Dutch vote, double vote, wrong country,
///      wrong poll, bad proof) deterministically. The crucial real-world property we
///      preserve: the SAME passport+poll always yields the SAME nullifier — so the test
///      reuses one nullifier to simulate a citizen trying to vote twice.
contract MockZKPassportVerifier is IZKPassportVerifier {
    /// Encode a fake proof's public signals exactly as the real verifier would surface them.
    function encode(bool verified, uint256 nullifier, bytes3 nationality, bytes32 scope)
        external
        pure
        returns (bytes memory publicInputs)
    {
        return abi.encode(verified, nullifier, nationality, scope);
    }

    function verify(bytes calldata, bytes calldata publicInputs)
        external
        pure
        returns (bool verified, uint256 nullifier, bytes3 nationality, bytes32 scope)
    {
        (verified, nullifier, nationality, scope) = abi.decode(publicInputs, (bool, uint256, bytes3, bytes32));
    }
}
