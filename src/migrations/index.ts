import * as migration_20261024_204304_initial from './20261024_204304_initial';
import * as migration_20261024_214644_blob_storage from './20261024_214644_blob_storage';
import * as migration_20261026_081651_badges_by_league from './20261026_081651_badges_by_league';

export const migrations = [
  {
    up: migration_20261024_204304_initial.up,
    down: migration_20261024_204304_initial.down,
    name: '20261024_204304_initial',
  },
  {
    up: migration_20261024_214644_blob_storage.up,
    down: migration_20261024_214644_blob_storage.down,
    name: '20261024_214644_blob_storage',
  },
  {
    up: migration_20261026_081651_badges_by_league.up,
    down: migration_20261026_081651_badges_by_league.down,
    name: '20261026_081651_badges_by_league'
  },
];
