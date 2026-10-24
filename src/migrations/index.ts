import * as migration_20261024_204304_initial from './20261024_204304_initial';

export const migrations = [
  {
    up: migration_20261024_204304_initial.up,
    down: migration_20261024_204304_initial.down,
    name: '20261024_204304_initial'
  },
];
