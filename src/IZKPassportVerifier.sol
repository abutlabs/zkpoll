// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @notice Minimal interface for the on-chain zkPassport proof verifier.
/// @dev The real verifier is generated/published by zkPassport (the `AQueryProofExecutor`
///      family, backed by a Groth16/Honk `Verifier.sol`). For local development we depend
///      only on this thin interface so the poll logic can be built and tested against a
///      mock today, then re-pointed at the real verifier during integration on Moonbase Alpha.
///
///      The verifier's job: cryptographically check the proof and return the public signals
///      we care about — the per-(person, poll) `nullifier` and the disclosed `nationality`.
///      `scope` is the poll id we bound the proof to (zkPassport: nullifier = Poseidon2(chip, domain, scope)).
interface IZKPassportVerifier {
    /// @param proof          The compressed-evm zkPassport proof bytes.
    /// @param publicInputs   The proof's public signals (encoding nullifier, nationality, scope, age, ...).
    /// @return verified      True iff the proof is cryptographically valid.
    /// @return nullifier     Unique per (passport, domain, scope=pollId). The ballot-box key.
    /// @return nationality   ISO 3166-1 alpha-3 as bytes3, e.g. "NLD" for the Netherlands.
    /// @return scope         The scope the proof was bound to (must equal the pollId being voted on).
    function verify(bytes calldata proof, bytes calldata publicInputs)
        external
        view
        returns (bool verified, uint256 nullifier, bytes3 nationality, bytes32 scope);
}
