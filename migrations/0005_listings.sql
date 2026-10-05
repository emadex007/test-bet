-- Property listing details on portfolio items. Only shown when Site settings → Features → Property listings is on
-- (the Real Estate pack switches it on). Other industries simply leave these empty.
ALTER TABLE projects ADD COLUMN listing_type TEXT NOT NULL DEFAULT '';  -- For Sale | For Rent | Short-let …
ALTER TABLE projects ADD COLUMN price        REAL NOT NULL DEFAULT 0;   -- 0 = "Price on request"
ALTER TABLE projects ADD COLUMN price_note   TEXT NOT NULL DEFAULT '';  -- e.g. per year, per night, outright
ALTER TABLE projects ADD COLUMN bedrooms     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN bathrooms    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN area         TEXT NOT NULL DEFAULT '';  -- e.g. 450 sqm, 1 plot
ALTER TABLE projects ADD COLUMN status       TEXT NOT NULL DEFAULT '';  -- Available | Under offer | Sold | Let
ALTER TABLE projects ADD COLUMN amenities    TEXT NOT NULL DEFAULT '';  -- one per line

CREATE INDEX IF NOT EXISTS idx_projects_listing ON projects (published, listing_type, price);
