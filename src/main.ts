process.env.ORACLE_PUBLIC_KEY =
  'B62qmdp1brcf4igTDyv7imzhpVifpNsb2dm3TRJb2bNEeVn1q8uZ9s8';

import express, { Request, Response } from 'express';
import { zkProgramPass3 } from './pass3';

const app = express();
const port = 3000;

let verificationKeyZkProgram: string | null = null;
const setupZkProgram = async () => {
  console.log('Compiling zk program');
  const { verificationKey } = await zkProgramPass3.compile();
  verificationKeyZkProgram = verificationKey;
  console.log('Zk program compiled');
};

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.get('/hello', (req: Request, res: Response) => {
  res.send(
    verificationKeyZkProgram ? 'Zk program is ready' : 'Zk program is not ready'
  );
});

app.listen(port, () => {
  console.log('Server started at http://localhost:' + port);
});

setupZkProgram();
