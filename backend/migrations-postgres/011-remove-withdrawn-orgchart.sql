CREATE TABLE IF NOT EXISTS withdrawn_orgchart_records (
  section_name TEXT NOT NULL, item_id BIGINT NOT NULL, payload JSONB NOT NULL, archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(section_name, item_id)
);
INSERT INTO withdrawn_orgchart_records (section_name, item_id, payload)
SELECT section_name, item_id, payload FROM leadership_sections WHERE section_name = 'orgChart'
ON CONFLICT (section_name, item_id) DO NOTHING;
DELETE FROM leadership_sections WHERE section_name = 'orgChart';
