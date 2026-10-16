import * as migration_20261013_180516_initial from './20261013_180516_initial';
import * as migration_20261013_185717_roles_owners_outcome from './20261013_185717_roles_owners_outcome';
import * as migration_20261014_012522_media_card_size from './20261014_012522_media_card_size';
import * as migration_20261015_103653_readers_follows from './20261015_103653_readers_follows';
import * as migration_20261015_115421_leads from './20261015_115421_leads';
import * as migration_20261015_170810_readers_phone from './20261015_170810_readers_phone';
import * as migration_20261016_024154_media_object_key from './20261016_024154_media_object_key';

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
    name: '20261014_012522_media_card_size',
  },
  {
    up: migration_20261015_103653_readers_follows.up,
    down: migration_20261015_103653_readers_follows.down,
    name: '20261015_103653_readers_follows',
  },
  {
    up: migration_20261015_115421_leads.up,
    down: migration_20261015_115421_leads.down,
    name: '20261015_115421_leads',
  },
  {
    up: migration_20261015_170810_readers_phone.up,
    down: migration_20261015_170810_readers_phone.down,
    name: '20261015_170810_readers_phone',
  },
  {
    up: migration_20261016_024154_media_object_key.up,
    down: migration_20261016_024154_media_object_key.down,
    name: '20261016_024154_media_object_key'
  },
];
