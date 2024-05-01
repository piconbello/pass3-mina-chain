process.env.ORACLE_PUBLIC_KEY =
  'B62qmdp1brcf4igTDyv7imzhpVifpNsb2dm3TRJb2bNEeVn1q8uZ9s8';

import fs from 'fs';
import { jest } from '@jest/globals';
import { TestingAppChain } from '@proto-kit/sdk';
import {
  PrivateKey,
  Provable,
  Bool,
  Field,
  Poseidon,
  CircuitString,
  verify,
  VerificationKey,
  Signature,
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
      currentDate: string;
    };
    walletId: string; // TODO change to publicKey
    doesExist: boolean;
    signature: {
      r: string;
      s: string;
    };
    publicKey: string;
  };
}

const mockOracleResponse: OracleResponse = {
  message: 'Service called successfully',
  data: {
    identityData: {
      over18: true,
      sanctioned: false,
      unique: true,
      currentDate: '20240501',
    },
    walletId: 'EKFFPMTjJivav7xxEdXyCVKs5KedZsZaQWSWXkXdM4UjeH54rJV4',
    doesExist: true,
    signature: {
      r: '3713807165287585871472741919076973598580564819317795203796236102083443117890',
      s: '15760059556638958257089083211160862708145378018944207428893737827195062927825',
    },
    publicKey: 'B62qmdp1brcf4igTDyv7imzhpVifpNsb2dm3TRJb2bNEeVn1q8uZ9s8',
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

    console.log('compiling...');
    const verificationKey = await zkProgramPass3.compile();
    console.log('compile done');

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
      'http://localhost:8080/oracle/EKFFPMTjJivav7xxEdXyCVKs5KedZsZaQWSWXkXdM4UjeH54rJV4'
    ).then((res) => res.json())) as OracleResponse;
    // console.log('oracleResponse: ', oracleResponse);

    const oracleData = oracleResponse.data;
    // console.log('oracleData: ', oracleData);

    // const yyy = oracleData.identityData.over18;
    // console.log('yyy: ', yyy);
    // const xxx = Bool(oracleData.identityData.over18);
    // console.log('xxx: ', xxx);
    // Provable.log('xxx: ', xxx);

    const tempIdentityData = new Identity({
      over18: Bool(oracleData.identityData.over18),
      sanctioned: Bool(oracleData.identityData.sanctioned),
      unique: Bool(oracleData.identityData.unique),
      currentDate: Field.from(oracleData.identityData.currentDate),
    });

    const oracleSignature = Signature.fromJSON(oracleData.signature);
    // console.log('oracleSignature: ', oracleSignature);

    console.log('tempIdentityData', tempIdentityData);

    const [creatorPublicKey, creatorDataSignature] =
      generateSignatureUsingDefaultKeys(
        tempIdentityData.toFields(),
        'EKFFPMTjJivav7xxEdXyCVKs5KedZsZaQWSWXkXdM4UjeH54rJV4'
      );

    // console.log('signature created', creatorPublicKey, creatorDataSignature);

    // console.log('proof creating....');

    const proof = await zkProgramPass3.proveIdentity(
      tempIdentityData,
      oracleSignature,
      creatorDataSignature,
      creatorPublicKey
    );
    console.log('proof created: ', proof);

    // write proof to a file
    const proofStr = JSON.stringify(proof);
    fs.writeFileSync('proof.json', proofStr);

    // proof.publicOutput.ageToProveInYears = Field(35);

    // const jsonParsed = JSON.parse(proofStr);
    // const proof = CanMintProof.fromJSON(jsonParsed);
    // const ok = await verify(proof, verificationKey.verificationKey);
    // console.log('ok: ', ok);

    // const parsedJson = JSON.parse(proof);
    // const proof20 = CanMintProof.fromJSON(parsedJson);

    // const tx = await appChain.transaction(sender, () => {
    //   pass3.mint(proof);
    // });

    // await tx.sign();
    // await tx.send();

    // const block = await appChain.produceBlock();

    // // await sleep(8000);
    // console.log('sleep 1 done');

    // const balance = await appChain.query.runtime.Pass3.myState.get(
    //   proof.publicOutput.creatorPublicKey
    // );

    // expect(block?.transactions[0].status.toBoolean()).toBe(true);
    // expect(balance?.toBigInt()).toBe(1000n);
  }, 1_000_000);
});
