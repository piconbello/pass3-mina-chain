process.env.ORACLE_PUBLIC_KEY =
  'B62qosqYvYKpaeYLctJ1s47fKbAafJbKEsuyP3MbtzU1DyuS5J2shkr';

import { jest } from '@jest/globals';
import { TestingAppChain } from '@proto-kit/sdk';
import { PrivateKey, Bool, Field, verify, Signature, PublicKey } from 'o1js';
import { Pass3, zkProgramPass3 } from '../src/pass3';
import { Identity, OracleResponse } from '../src/utils';

const mockOracleResponse: OracleResponse = {
  data: {
    identityData: {
      walletId: 'B62qkUB1fZMwGHCavGwQYjTkk1KcoHYCZ5BzKcGjn3Q22wbpp1dqNnN',
      over18: true,
      sanctioned: false,
      unique: true,
      timestamp: 1715800344918,
    },
    doesExist: true,
    signature: {
      r: '19991836609674267495007178261932950444671959597230755987092448987128012662181',
      s: '20373786362087879888748332332083636959879183926665629349907624781046728478862',
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
      walletId: PublicKey.fromBase58(oracleData.identityData.walletId),
    });

    const oracleSignature = Signature.fromJSON(oracleData.signature);

    const proof = await zkProgramPass3.proveIdentity(
      tempIdentityData,
      oracleSignature
    );

    const tx = await appChain.transaction(alice, () => {
      pass3.mint(proof);
    });

    await tx.sign();
    await tx.send();

    const block = await appChain.produceBlock();

    const identity = await appChain.query.runtime.Pass3.identities.get(
      proof.publicOutput.identity.walletId
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
