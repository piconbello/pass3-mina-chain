import { Experimental, PublicKey, Signature } from 'o1js';
import { BaseAttribute, BaseAttributeOutput } from '../base';

// Define individual attribute structs
export class UniqueAttribute extends BaseAttribute {}

// Define public outputs for each attribute
export class UniqueOutput extends BaseAttributeOutput {}

// ZkProgram for proving a user is unique
export const zkProgramUnique = Experimental.ZkProgram({
  name: 'ZkProofUnique',
  publicOutput: UniqueOutput,
  methods: {
    proveUnique: {
      privateInputs: [UniqueAttribute, Signature, PublicKey],
      method(
        data: UniqueAttribute,
        oracleSignature: Signature,
        walletId: PublicKey
      ): UniqueOutput {
        // Verify the oracle's signature
        const validSignature = oracleSignature.verify(
          PublicKey.fromBase58(process.env.ORACLE_PUBLIC_KEY as string),
          data.toFields()
        );
        validSignature.assertTrue('Invalid oracle signature');

        // Check if the user is unique
        data.value.assertTrue('User is not unique');

        // Return the public output
        return new UniqueOutput({ walletId, value: data.value });
      },
    },
  },
});

export class UniqueProof extends Experimental.ZkProgram.Proof(
  zkProgramUnique
) {}
