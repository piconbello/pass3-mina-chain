import express from 'express';
import { PublicKey, Field } from 'o1js';

const app = express();
app.use(express.json());

// Assume we have a way to initialize and access our Protokit runtime
import { initializeProtokit, getProtokit } from '../protokit/runtime'; // TODO path to Protokit runtime
import { IdentityAttributes } from '../runtime';

// Initialize Protokit when the API server starts
initializeProtokit();

app.post('/generate-witness', async (req, res) => {
  const { walletAddress, attributeName } = req.body;

  if (!walletAddress || !attributeName) {
    return res
      .status(400)
      .json({ error: 'Missing walletAddress or attributeName' });
  }

  try {
    const protokit = getProtokit();
    const identityModule = protokit.runtime.resolve(IdentityAttributes);

    // Construct the key as we do in the Protokit module
    const key = Field.fromString(`mina#${walletAddress}#${attributeName}`);

    // Generate the witness
    const witness = await identityModule.generateWitness(key);

    // Get the current Merkle root
    const root = await identityModule.getRoot();

    // Get the attribute value
    const value = await identityModule.attributesMerkleMap.get(key);

    res.json({
      witness: witness.toJSON(),
      root: root.toString(),
      key: key.toString(),
      value: value.toString(),
    });
  } catch (error) {
    console.error('Error generating witness:', error);
    res.status(500).json({ error: 'Failed to generate witness' });
  }
});
