import { Bool, Field, Struct } from 'o1js';

export interface OracleData {
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
}

export interface OracleResponse {
  message: string;
  data: OracleData;
}

export class Identity extends Struct({
  over18: Bool,
  sanctioned: Bool,
  unique: Bool,
  currentDate: Field,
}) {
  // method for signature creation and verification
  toFields(): Field[] {
    return [
      ...this.over18.toFields(),
      ...this.sanctioned.toFields(),
      ...this.unique.toFields(),
      this.currentDate,
    ];
  }
}
