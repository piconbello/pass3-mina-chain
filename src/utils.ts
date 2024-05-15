import { Bool, Field, PublicKey, Struct } from 'o1js';

export interface OracleData {
  identityData: {
    // could be an interface
    over18: boolean;
    sanctioned: boolean;
    unique: boolean;
    timestamp: number;
    walletId: string;
  };
  doesExist: boolean;
  signature: {
    r: string;
    s: string;
  };
}

export interface OracleResponse {
  data: OracleData;
}

export class Identity extends Struct({
  over18: Bool,
  sanctioned: Bool,
  unique: Bool,
  timestamp: Field,
  walletId: PublicKey,
}) {
  // method for signature creation and verification
  toFields(): Field[] {
    return [
      ...this.walletId.toFields(),
      ...this.over18.toFields(),
      ...this.sanctioned.toFields(),
      ...this.unique.toFields(),
      this.timestamp,
    ];
  }
}
