import * as migration_20261013_180516_initial from './20261013_180516_initial';
import * as migration_20261013_185717_roles_owners_outcome from './20261013_185717_roles_owners_outcome';
import * as migration_20261014_012522_media_card_size from './20261014_012522_media_card_size';

export const migrations = [
  {
    up: migration_20261013_180516_initial.up,
    down: migration_20261013_180516_initial.down,
    name: '20261013_180516_initial',
  },
  {
    up: migration_20261013_185717_roles_owners_outcome.up,
    down: migration_20261013_185717_roles_owners_outcome.down,
    name: '20261013_185717_roles_owners_outcome',
  },
  {
    up: migration_20261014_012522_media_card_size.up,
    down: migration_20261014_012522_media_card_size.down,
    name: '20261014_012522_media_card_size'
  },
];
