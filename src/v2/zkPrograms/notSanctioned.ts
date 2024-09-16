import { Experimental, PublicKey, Signature } from 'o1js';
import { BaseAttribute, BaseAttributeOutput } from '../base';

// Define individual attribute structs
export class NotSanctionedAttribute extends BaseAttribute {}

// Define public outputs for each attribute
export class NotSanctionedOutput extends BaseAttributeOutput {}

// ZkProgram for proving a user is not sanctioned
export const zkProgramNotSanctioned = Experimental.ZkProgram({
  name: 'ZkProofNotSanctioned',
  publicOutput: NotSanctionedOutput,
  methods: {
    proveNotSanctioned: {
      privateInputs: [NotSanctionedAttribute, Signature, PublicKey],
      method(
        data: NotSanctionedAttribute,
        oracleSignature: Signature,
        walletId: PublicKey
      ): NotSanctionedOutput {
        // Verify the oracle's signature
        const validSignature = oracleSignature.verify(
          PublicKey.fromBase58(process.env.ORACLE_PUBLIC_KEY as string),
          data.toFields()
        );
        validSignature.assertTrue('Invalid oracle signature');

        // Check if the user is not sanctioned
        data.value.assertTrue('User is sanctioned');

        // Return the public output
        return new NotSanctionedOutput({ walletId, value: data.value });
      },
    },
  },
});

export class NotSanctionedProof extends Experimental.ZkProgram.Proof(
  zkProgramNotSanctioned
) {}
