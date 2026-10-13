import * as migration_20261013_180516_initial from './20261013_180516_initial';

export const migrations = [
  {
    up: migration_20261013_180516_initial.up,
    down: migration_20261013_180516_initial.down,
    name: '20261013_180516_initial'
  },
];
