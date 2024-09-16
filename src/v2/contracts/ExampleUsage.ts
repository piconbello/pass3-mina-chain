import {
  Field,
  MerkleMapWitness,
  method,
  PublicKey,
  SmartContract,
} from 'o1js';
import { AttributeVerifier } from './AttributeVerifier';

// Example usage in another on-chain contract
export class ExampleUsage extends SmartContract {
  // Method that requires attribute verification
  @method someMethodRequiringVerification(
    userPublicKey: PublicKey,
    attributeKey: Field,
    attributeValue: Field,
    witness: MerkleMapWitness
  ) {
    // Address of the deployed AttributeVerifier contract
    const verifierAddress = PublicKey.fromBase58('B62qjtqmemKX....');
    const attributeVerifier = new AttributeVerifier(verifierAddress);

    // Verify the attribute using the AttributeVerifier contract
    const isValid = attributeVerifier.verifyAttribute(
      attributeKey,
      attributeValue,
      witness
    );

    // Ensure the attribute is valid before proceeding
    isValid.assertTrue('Invalid attribute');

    // If the attribute is valid, proceed with the method logic
    // ... (implementation specific to this method)
  }
}
