-- Industry features: matches and odds, casino games, coins, menu items, causes, sermons, doctors…
-- One table for all of them. Each industry pack lists its collections (src/packs/<id>.ts) and the
-- dashboard builds an editor for each from that list. Fields beyond the basics are stored as JSON in `data`.
CREATE TABLE IF NOT EXISTS items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT NOT NULL,                 -- which collection, e.g. match, game, coin, menu
  title       TEXT NOT NULL,
  grp         TEXT NOT NULL DEFAULT '',      -- category: league, menu section, game type…
  image       TEXT NOT NULL DEFAULT '',
  data        TEXT NOT NULL DEFAULT '{}',    -- the collection's other fields, as JSON
  featured    INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_items_kind ON items (kind, active, sort_order);
