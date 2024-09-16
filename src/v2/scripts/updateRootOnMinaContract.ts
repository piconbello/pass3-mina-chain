// Example of how to update the Mina contract with Protokit's root
import { Mina, PrivateKey, PublicKey } from 'o1js';
import { getProtokit } from './protokitRuntime'; // TODO: point to correct path
import { IdentityAttributes } from '../runtime';
import { AttributeVerifier } from '../contracts/AttributeVerifier';

export async function updateRootOnMinaContract() {
  const protokit = getProtokit();
  const identityModule = protokit.runtime.resolve(IdentityAttributes);

  // Get the current root from Protokit
  const currentRoot = await identityModule.getRoot();

  // Set up Mina connection (this is just an example, adjust as needed)
  const Network = Mina.Network(
    'https://proxy.berkeley.minaexplorer.com/graphql'
  );
  Mina.setActiveInstance(Network);

  const verifierAddress = PublicKey.fromBase58('B62qjtqmemKX....');
  const attributeVerifier = new AttributeVerifier(verifierAddress);

  const senderAccount = PrivateKey.fromBase58('...');
  const sender = senderAccount.toPublicKey();

  let transaction = await Mina.transaction(sender, () => {
    attributeVerifier.updateRoot(currentRoot);
  });

  await transaction.prove();
  await transaction.sign([senderAccount]).send();
}
