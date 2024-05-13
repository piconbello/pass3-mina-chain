process.env.ORACLE_PUBLIC_KEY =
  'B62qosqYvYKpaeYLctJ1s47fKbAafJbKEsuyP3MbtzU1DyuS5J2shkr';

import { jest } from '@jest/globals';
import { TestingAppChain } from '@proto-kit/sdk';
import {
  PrivateKey,
  Bool,
  Field,
  verify,
  Signature,
  CircuitString,
  PublicKey,
} from 'o1js';
import {
  Pass3,
  generateSignatureUsingDefaultKeys,
  zkProgramPass3,
} from '../src/pass3';
import { Identity } from '../src/utils';

interface OracleResponse {
  message: string;
  data: {
    identityData: {
      // could be an interface
      over18: boolean;
      sanctioned: boolean;
      unique: boolean;
      timestamp: number;
    };
    walletId: string; // TODO change to publicKey
    doesExist: boolean;
    signature: {
      r: string;
      s: string;
    };
  };
}

const mockOracleResponse: OracleResponse = {
  message: 'Service called successfully',
  data: {
    identityData: {
      over18: true,
      sanctioned: false,
      unique: true,
      timestamp: 1715278863167,
    },
    walletId: 'B62qosqYvYKpaeYLctJ1s47fKbAafJbKEsuyP3MbtzU1DyuS5J2shkr', // TODO :: doesn't have to be the same public key with `publicKey`
    doesExist: true,
    signature: {
      r: '13290693580590850811416649792758552000695392783513797078621797970041235995608',
      s: '13713802390576193094902875723993219131207245174794760390058715433977250109691',
    },
  },
};

// Mock node native fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockOracleResponse),
  })
) as any;

describe('pass3 interaction', () => {
  it('should create a proof and update the state', async () => {
    const appChain = TestingAppChain.fromRuntime({
      Pass3,
    });

    const verificationKey = await zkProgramPass3.compile();

    appChain.configurePartial({
      Runtime: {
        Pass3: {},
        Balances: {},
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const pass3 = appChain.runtime.resolve('Pass3');

    // Fetch user data from the oracle localhost:8080/oracle/:walletId
    const oracleResponse = (await fetch(
      'http://localhost:8080/oracle/B62qmKXrzYjhhgiCx8cQAfZ3V2ekkh2oNUocCbmRr1Kjxx4bM9TKwM3'
    ).then((res) => res.json())) as OracleResponse;
    // console.log('oracleResponse: ', oracleResponse);

    const oracleData = oracleResponse.data;

    const tempIdentityData = new Identity({
      over18: Bool(oracleData.identityData.over18),
      sanctioned: Bool(oracleData.identityData.sanctioned),
      unique: Bool(oracleData.identityData.unique),
      timestamp: Field.from(oracleData.identityData.timestamp),
    });

    const oracleSignature = Signature.fromJSON(oracleData.signature);

    const proof = await zkProgramPass3.proveIdentity(
      tempIdentityData,
      oracleSignature,
      PublicKey.fromBase58(oracleData.walletId)
    );

    const tx = await appChain.transaction(alice, () => {
      pass3.mint(proof);
    });

    await tx.sign();
    await tx.send();

    const block = await appChain.produceBlock();

    const identity = await appChain.query.runtime.Pass3.identities.get(
      proof.publicOutput.userPublicKey
    );

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(identity).toStrictEqual(proof.publicOutput.identity);

    const nonChangedProofVerification = await verify(
      proof,
      verificationKey.verificationKey
    );
    expect(nonChangedProofVerification).toBe(true);

    proof.publicOutput.identity.timestamp = Field.from(1715277274481);
    const changedProofVerification = await verify(
      proof,
      verificationKey.verificationKey
    );
    expect(changedProofVerification).toBe(false);
  }, 1_000_000);
});
