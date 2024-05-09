import { Balance } from '@proto-kit/library';
import { Balances } from './balances';
import { ModulesConfig } from '@proto-kit/common';
import { Pass3 } from './pass3';

export const modules = {
  Balances,
  Pass3,
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Pass3: {},
};

export default {
  modules,
  config,
};
