CREATE TABLE IF NOT EXISTS leadership_sections (
  section_name TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (section_name, item_id)
);

CREATE TABLE IF NOT EXISTS home_spotlight (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS home_spotlight_people (
  id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS song_link_sections (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS song_link_cards (
  section_id INTEGER NOT NULL REFERENCES song_link_sections(id),
  card_id INTEGER NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (section_id, card_id)
);