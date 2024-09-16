// On-Chain Smart Contract (deployed to Mina blockchain)
import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  MerkleMapWitness,
  Bool,
} from 'o1js';

// Smart contract for verifying user attributes on-chain
export class AttributeVerifier extends SmartContract {
  // State variable to store the current Merkle root
  @state(Field) merkleRoot = State<Field>();

  // Method to update the Merkle root
  @method updateRoot(newRoot: Field) {
    // This method should be called periodically to update the on-chain root
    // TODO: Add access control to this method to ensure only authorized parties can update the root
    this.merkleRoot.set(newRoot);
  }

  // Method to verify a user's attribute
  @method verifyAttribute(
    key: Field,
    value: Field,
    witness: MerkleMapWitness
  ): Bool {
    // Get the current Merkle root
    const currentRoot = this.merkleRoot.get();
    this.merkleRoot.requireEquals(currentRoot);

    // Compute the root and key using the provided witness
    const [computedRoot, computedKey] = witness.computeRootAndKey(value);

    // Check if the computed root matches the current root and the computed key matches the provided key
    return computedRoot.equals(currentRoot).and(computedKey.equals(key));
  }
}
