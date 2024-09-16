import { Experimental, PublicKey, Signature } from 'o1js';
import { BaseAttribute, BaseAttributeOutput } from '../base';

// Define individual attribute structs
export class Over18Attribute extends BaseAttribute {}

// Define public outputs for each attribute
export class Over18Output extends BaseAttributeOutput {}

// ZkProgram for proving a user is over 18
export const zkProgramOver18 = Experimental.ZkProgram({
  name: 'ZkProofOver18',
  publicOutput: Over18Output,
  methods: {
    proveOver18: {
      privateInputs: [Over18Attribute, Signature, PublicKey],
      method(
        data: Over18Attribute,
        oracleSignature: Signature,
        walletId: PublicKey
      ): Over18Output {
        // Verify the oracle's signature
        const validSignature = oracleSignature.verify(
          PublicKey.fromBase58(process.env.ORACLE_PUBLIC_KEY as string),
          data.toFields()
        );
        validSignature.assertTrue('Invalid oracle signature');

        // Check if the user is over 18
        data.value.assertTrue('User is not over 18');

        // Return the public output
        return new Over18Output({ walletId, value: data.value });
      },
    },
  },
});

export class Over18Proof extends Experimental.ZkProgram.Proof(
  zkProgramOver18
) {}
