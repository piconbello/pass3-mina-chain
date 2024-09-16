import { Bool, Field, Provable, PublicKey, Struct } from 'o1js';

// Base class for all attributes
export class BaseAttribute extends Struct({
  value: Bool,
}) {
  static fromFields(fields: Field[]): BaseAttribute {
    return super.fromFields(fields) as BaseAttribute;
  }

  toFields(): Field[] {
    return [this.value.toField()];
  }
}

// Base class for all public outputs
export class BaseAttributeOutput extends Struct({
  walletId: PublicKey,
  value: Bool,
}) {
  static fromFields(fields: Field[]): BaseAttributeOutput {
    return super.fromFields(fields) as BaseAttributeOutput;
  }

  toFields(): Field[] {
    return [...this.walletId.toFields(), this.value.toField()];
  }
}
