import { Bool, Field, Struct } from 'o1js';

export class Identity extends Struct({
  over18: Bool,
  sanctioned: Bool,
  unique: Bool,
  currentDate: Field,
}) {
  // method for signature creation and verification
  toFields(): Field[] {
    const b = this.over18.toField();
    const a = this.over18.toFields();
    return [
      ...this.over18.toFields(),
      ...this.sanctioned.toFields(),
      ...this.unique.toFields(),
      this.currentDate,
    ];
  }
}
