-- The hosted site's colours, edited at /admin/home. Filled from web/src/config on the
-- first `npm run setup`; after that the site uses these, not the files.

-- 'palette', 'randomizer', and 'defaults' (palette.defaults.json, refreshed on every setup)
CREATE TABLE site_settings (
  key         varchar(64) PRIMARY KEY,
  value       jsonb       NOT NULL,
  updated_at  timestamptz NOT NULL
);

-- Named palettes for the editor and the randomizer
CREATE TABLE palette_templates (
  name        varchar(40) PRIMARY KEY,
  palette     jsonb       NOT NULL,
  updated_at  timestamptz NOT NULL
);
