CREATE TABLE IF NOT EXISTS content_documents (
  id BIGSERIAL PRIMARY KEY, page_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL,
  schema_version INTEGER NOT NULL, published_version_id BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS content_versions (
  id BIGSERIAL PRIMARY KEY, document_id BIGINT NOT NULL REFERENCES content_documents(id), version_number INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('draft','published','superseded','discarded')), base_version_number INTEGER,
  payload JSONB NOT NULL, authored_by TEXT NOT NULL, authored_provider TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_by TEXT, published_at TIMESTAMPTZ, change_summary TEXT NOT NULL DEFAULT '', UNIQUE(document_id, version_number)
);
CREATE TABLE IF NOT EXISTS content_audit_events (
  id BIGSERIAL PRIMARY KEY, document_id BIGINT NOT NULL REFERENCES content_documents(id), version_id BIGINT REFERENCES content_versions(id),
  actor_subject TEXT NOT NULL, actor_provider TEXT NOT NULL, action TEXT NOT NULL, source_version INTEGER, target_version INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_versions_document_state ON content_versions(document_id, state);
CREATE INDEX IF NOT EXISTS idx_content_audit_document ON content_audit_events(document_id, created_at);
INSERT INTO content_documents (id, page_key, content_type, schema_version) VALUES (1, 'announcement-page', 'announcement-page', 1) ON CONFLICT (page_key) DO NOTHING;
INSERT INTO content_versions (document_id, version_number, state, payload, authored_by, authored_provider, published_by, published_at, change_summary)
SELECT 1, 1, 'published', $$ {"schemaVersion":1,"hero":{"title":"Announcements","body":"Please stay updated with the latest changes and announcements to ensure the best experience while using the application."},"carousel":[],"trainings":[],"notices":[{"id":"carousel","title":"New feature: Carousel","body":"Certificate Gallery has been added to make your experience more interactive and engaging.","order":0}],"reminder":{"title":"Reminder","body":"Do not forget to check your latest updates and complete pending tasks to stay up to date with the system."}} $$::jsonb, 'migration', 'system', 'migration', NOW(), 'Initial migrated announcement content'
WHERE NOT EXISTS (SELECT 1 FROM content_versions WHERE document_id = 1 AND version_number = 1);
UPDATE content_documents SET published_version_id = (SELECT id FROM content_versions WHERE document_id = 1 AND version_number = 1) WHERE id = 1 AND published_version_id IS NULL;
