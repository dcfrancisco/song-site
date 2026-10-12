CREATE TABLE IF NOT EXISTS content_documents (
  id INTEGER PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  published_version_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES content_documents(id),
  version_number INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('draft', 'published', 'superseded', 'discarded')),
  base_version_number INTEGER,
  payload TEXT NOT NULL,
  authored_by TEXT NOT NULL,
  authored_provider TEXT NOT NULL,
  created_at TEXT NOT NULL,
  published_by TEXT,
  published_at TEXT,
  change_summary TEXT NOT NULL DEFAULT '',
  UNIQUE(document_id, version_number)
);

CREATE TABLE IF NOT EXISTS content_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES content_documents(id),
  version_id INTEGER REFERENCES content_versions(id),
  actor_subject TEXT NOT NULL,
  actor_provider TEXT NOT NULL,
  action TEXT NOT NULL,
  source_version INTEGER,
  target_version INTEGER,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_versions_document_state ON content_versions(document_id, state);
CREATE INDEX IF NOT EXISTS idx_content_audit_document ON content_audit_events(document_id, created_at);

INSERT OR IGNORE INTO content_documents (id, page_key, content_type, schema_version, created_at, updated_at)
VALUES (1, 'announcement-page', 'announcement-page', 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO content_versions
  (document_id, version_number, state, payload, authored_by, authored_provider, created_at, published_by, published_at, change_summary)
VALUES
  (1, 1, 'published', '{"schemaVersion":1,"hero":{"title":"Announcements","body":"Please stay updated with the latest changes and announcements to ensure the best experience while using the application."},"carousel":[{"id":"bayona","name":"Mark Anthony Bayona","image":"assets/images/congrats1.png","body":"Certified Full Stack Developer","order":0},{"id":"ignacio","name":"Alison Ignacio","image":"assets/images/congrats2.png","body":"Certified Full Stack Developer","order":1},{"id":"ardione","name":"Ardione David","image":"assets/images/congrats3.png","body":"Certified Full Stack Developer","order":2},{"id":"fernandez","name":"Henry Fernandez","image":"assets/images/congrats4.png","body":"Certified Full Stack Developer","order":3}],"trainings":[{"id":"tq","title":"Technology Quotient (TQ)","description":"New technologies are helping our clients reinvent their businesses. Stay relevant and complete foundational courses on new technologies.","link":"https://www.pluralsight.com","linkLabel":"Pluralsight","order":0},{"id":"gen-ai","title":"Gen AI Trainings","description":"Learn more and use this cutting-edge technology to help Accenture and our clients maximize the value of Gen AI.","link":"https://in.accenture.com/philippines/","linkLabel":"Buhay Accenture","order":1},{"id":"workday","title":"Workday: Required Trainings","description":"Visit Learning Home in Workday and find required trainings.","link":"https://wd103.myworkday.com/accenture/learning","linkLabel":"Workday","order":2},{"id":"mha","title":"Global Mental Health Ally Training","description":"The Mental Health Ally program equips people to foster a supportive, inclusive workplace.","link":"https://wd103.myworkday.com/accenture/learning","linkLabel":"Workday","order":3},{"id":"isa","title":"IS Gold Advocate","description":"Stay up to date with your IS Advocate training and recommended actions.","link":"https://in.accenture.com/protectingaccenture/dashboard/","linkLabel":"ISA Dashboard","order":4},{"id":"coding","title":"Coding Standards","description":"Learn the rules and principles that support good code and good practices.","link":"https://in.accenture.com/cioorganization/cio-bootcamp/cio-bootcamp-roles/developer/coding-standards/","linkLabel":"CIO Organization","order":5}],"notices":[{"id":"carousel","title":"New feature: Carousel","body":"Certificate Gallery has been added to make your experience more interactive and engaging.","order":0}],"reminder":{"title":"Reminder","body":"Do not forget to check your latest updates and complete pending tasks to stay up to date with the system."}}', 'migration', 'system', datetime('now'), 'migration', datetime('now'), 'Initial migrated announcement content');

UPDATE content_documents SET published_version_id = (SELECT id FROM content_versions WHERE document_id = 1 AND version_number = 1), updated_at = datetime('now') WHERE id = 1;
