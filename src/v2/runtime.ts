import {
  runtimeMethod,
  RuntimeModule,
  runtimeModule,
  state,
} from '@proto-kit/module';
import { State, StateMap } from '@proto-kit/protocol';
import { NotSanctionedProof, Over18Proof, UniqueProof } from './zkPrograms';
import { Field, MerkleMapWitness, Bool, Poseidon } from 'o1js';

@runtimeModule()
export class IdentityAttributes extends RuntimeModule<Record<string, never>> {
  @state() public attributesMerkleMap = StateMap.from<Field, Field>(
    Field,
    Field
  );

  @state() public currentRoot = State.from<Field>(Field);

  private createKey(walletId: string, attribute: string): Field {
    return Poseidon.hash([Field(walletId), Field(attribute)]);
  }

  @runtimeMethod()
  public mintOver18(proof: Over18Proof) {
    proof.verify();

    const publicOutput = proof.publicOutput;
    const key = this.createKey(publicOutput.walletId.toString(), 'isOver18');
    const value = publicOutput.value ? Field(1) : Field(0);

    this.attributesMerkleMap.set(key, value);
  }

  @runtimeMethod()
  public mintNotSanctioned(proof: NotSanctionedProof) {
    proof.verify();

    const publicOutput = proof.publicOutput;
    const key = this.createKey(
      publicOutput.walletId.toString(),
      'isNotSanctioned'
    );
    const value = publicOutput.value ? Field(1) : Field(0);

    this.attributesMerkleMap.set(key, value);
  }

  @runtimeMethod()
  public mintUnique(proof: UniqueProof) {
    proof.verify();

    const publicOutput = proof.publicOutput;
    const key = this.createKey(publicOutput.walletId.toString(), 'isUnique');
    const value = publicOutput.value ? Field(1) : Field(0);

    this.attributesMerkleMap.set(key, value);
  }

  @runtimeMethod()
  public updateRoot() {
    // Note: We might need to implement a method to get the root if it's not directly available
    // This is a placeholder and may need to be adjusted based on Protokit's API
    // const newRoot = this.attributesMerkleMap.getRoot();
    // this.currentRoot.set(newRoot);
  }

  @runtimeMethod()
  public getRoot() {
    // return this.currentRoot.get();
  }

  @runtimeMethod()
  public generateWitness(key: Field): MerkleMapWitness {
    // return this.attributesMerkleMap.merkleMap.getWitness(key);
    // Note: We might need to implement a method to generate a witness if it's not directly available
    // This is a placeholder and may need to be adjusted based on Protokit's API
    // return await this.attributesMerkleMap.getWitness(key);
    throw new Error('Method not implemented.');
  }
}
