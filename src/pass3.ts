import {
  runtimeMethod,
  runtimeModule,
  RuntimeModule,
  state,
} from '@proto-kit/module';
import { StateMap } from '@proto-kit/protocol';
import {
  PublicKey,
  Experimental,
  Field,
  Struct,
  Signature,
  PrivateKey,
} from 'o1js';
import { Identity } from './utils';

export class PublicOutput extends Struct({
  identity: Identity,
  userPublicKey: PublicKey,
}) {}

export const generateSignatureUsingDefaultKeys = (
  fieldsArray: Field[],
  privateKey: string
): [PublicKey, Signature] => {
  /*
    Default private and public keys that users can use to skip this step
    and not sign the data themselves - proof consumer will see that the
    user did not provide his own signature and instead used the default.
  */
  const creatorPrivateKey = PrivateKey.fromBase58(privateKey);
  const creatorPublicKey = creatorPrivateKey.toPublicKey();
  const creatorDataSignature = Signature.create(creatorPrivateKey, fieldsArray);
  return [creatorPublicKey, creatorDataSignature];
};

// your zk program goes here
export const zkProgramPass3 = Experimental.ZkProgram({
  name: 'ZkProofPass3',
  publicOutput: PublicOutput, // defined above
  methods: {
    proveIdentity: {
      privateInputs: [
        Identity,
        Signature, // zkOracle data signature
        PublicKey, // user wallet public key
      ],
      method(
        personalData: Identity,
        oracleSignature: Signature,
        userWalletId: PublicKey
      ): PublicOutput {
        // Validate the data from the oracle
        const validSignature = oracleSignature.verify(
          PublicKey.fromBase58(process.env.ORACLE_PUBLIC_KEY as string),
          personalData.toFields()
        );
        validSignature.assertTrue('Invalid oracle signature');

        // TODO: MAYBE Better assertions for the data
        personalData.over18.assertTrue('over18 is not true');
        personalData.unique.assertTrue('unique is not true');
        personalData.sanctioned.assertFalse('sanctioned is not false');

        return new PublicOutput({
          identity: personalData,
          userPublicKey: userWalletId,
        });
      },
    },
  },
});

// define the type of the proof
export class Pass3Proof extends Experimental.ZkProgram.Proof(zkProgramPass3) {}

@runtimeModule()
export class Pass3 extends RuntimeModule<Record<string, never>> {
  @state() public identities = StateMap.from<PublicKey, Identity>(
    PublicKey,
    Identity
  );

  @runtimeMethod()
  public mint(pass3Proof: Pass3Proof) {
    pass3Proof.verify();

    const publicOutput = pass3Proof.publicOutput;
    const userPublicKey = publicOutput.userPublicKey;
    const identity = publicOutput.identity;

    // Update the identity of the user
    this.identities.set(userPublicKey, identity);
  }
}
