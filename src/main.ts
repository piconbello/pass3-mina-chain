import { exit } from 'process';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { Bool, Field, PrivateKey, PublicKey, Signature } from 'o1js';
import { InMemorySigner } from '@proto-kit/sdk';

import { client } from './client.config';
import { zkProgramPass3 } from './pass3';
import { Identity, OracleData, OracleResponse } from './utils';

dotenv.config();

const app = express();
app.use(express.json());

let verificationKeyZkProgram: string | null = null;
let chainClient: any = null;
let signerPublicKey: PublicKey | null = null;

const setup = async () => {
  if (!process.env.SIGNER_PRIVATE_KEY) {
    console.error('Missing signer private key');
    exit(1);
  }

  if (!process.env.ORACLE_PUBLIC_KEY) {
    console.error('Missing oracle public key');
    exit(1);
  }

  if (!process.env.ORACLE_BASE_URL) {
    console.error('Missing oracle base url');
    exit(1);
  }

  console.log('Compiling zk program');
  const { verificationKey } = await zkProgramPass3.compile();
  verificationKeyZkProgram = verificationKey;
  console.log('Zk program compiled');

  console.log('Setting up signer public key');
  const signerPrivateKey = PrivateKey.fromBase58(
    process.env.SIGNER_PRIVATE_KEY
  );
  signerPublicKey = signerPrivateKey.toPublicKey();
  console.log('Signer public key ready');

  console.log('Setting up chain client');
  await client.start();

  const inMemorySigner = new InMemorySigner();
  client.registerValue({
    Signer: inMemorySigner,
  });

  const resolvedInMemorySigner = client.resolve('Signer') as InMemorySigner;
  resolvedInMemorySigner.config = { signer: signerPrivateKey };

  chainClient = client;
  console.log('Chain client ready');
};

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.get('/hello', (req: Request, res: Response) => {
  res.send(
    verificationKeyZkProgram && chainClient
      ? 'Zk program & chain client is ready'
      : 'Zk program & chain client is not ready'
  );
});

app.post('/prove', async (req: Request, res: Response) => {
  if (!verificationKeyZkProgram || !chainClient || !signerPublicKey) {
    res.status(500).send({
      message: 'Zk program, chain client or signer public key missing',
      success: false,
    });
    return;
  }

  let walletId = '';
  try {
    walletId = req.body.walletId;
    if (!walletId) {
      res.status(400).send({
        message: 'Wallet id is missing',
        success: false,
      });
      return;
    }
  } catch (error) {
    console.log('error on parsing req body', error);
    res.status(500).send({
      success: false,
      message: 'Failed to parse request body',
    });
    return;
  }

  // Fetch user data from the oracle
  let oracleData: OracleData | null = null;
  try {
    const response = await fetch(
      `${process.env.ORACLE_BASE_URL}/oracle/${walletId}`
    );

    const _response = (await response.json()) as OracleResponse;

    // Check if status is 200
    if (response.status !== 200) {
      res.status(response.status).send({
        message: 'Failed to fetch oracle response',
        success: false,
      });
      return;
    }

    oracleData = _response.data;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: 'Failed to fetch oracle response',
      success: false,
    });
    return;
  }

  if (!oracleData) {
    res.status(500).send({
      message: 'Failed to parse oracle response',
      success: false,
    });
    return;
  }

  // Create a proof
  const tempIdentityData = new Identity({
    over18: Bool(oracleData.identityData.over18),
    sanctioned: Bool(oracleData.identityData.sanctioned),
    unique: Bool(oracleData.identityData.unique),
    timestamp: Field.from(oracleData.identityData.timestamp),
    walletId: PublicKey.fromBase58(oracleData.identityData.walletId),
  });

  const oracleSignature = Signature.fromJSON(oracleData.signature);

  let proof: any = null;
  try {
    proof = await zkProgramPass3.proveIdentity(
      tempIdentityData,
      oracleSignature
    );
  } catch (error) {
    console.error('Failed to create proof');
    console.error(error);
    res.status(500).send({
      message: 'Failed to create proof',
      success: false,
    });
    return;
  }

  if (!proof) {
    res.status(500).send({
      message: 'Failed to create proof silently',
      success: false,
    });
    return;
  }

  const pass3 = chainClient.runtime.resolve('Pass3');

  // Send the proof to the chain
  const tx = await chainClient.transaction(signerPublicKey, () => {
    pass3.mint(proof);
  });

  await tx.sign();
  await tx.send();

  // return success message with the proof
  res.send({
    message: 'Proof created and sent to the chain',
    success: true,
    proof,
  });
});

app.listen(process.env.PORT, () => {
  console.log('Server started at http://localhost:' + process.env.PORT);
});

setup();
