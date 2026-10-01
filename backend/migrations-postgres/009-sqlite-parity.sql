-- PostgreSQL parity migration.
-- Keeps the current relational API tables and adds the complete SQLite-era
-- compatibility tables/data needed by the remaining application surfaces.

CREATE TABLE IF NOT EXISTS training_tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started',
  progress NUMERIC NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL DEFAULT '',
  completed_at TEXT NOT NULL DEFAULT '',
  actual_duration TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  external_links JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS journey_statuses (
  status TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS journey_items (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  route TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started' REFERENCES journey_statuses(status),
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  last_updated TEXT NOT NULL DEFAULT '',
  is_expanded BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS home_spotlight (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS home_spotlight_people (
  id BIGSERIAL PRIMARY KEY,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS song_link_sections (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS song_link_cards (
  section_id BIGINT NOT NULL REFERENCES song_link_sections(id) ON DELETE CASCADE,
  card_id BIGINT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (section_id, card_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_type_title ON tasks (task_type, title);

INSERT INTO journey_statuses (status, sort_order) VALUES
  ('Not Started', 0), ('In Progress', 1), ('Blocked', 2), ('Completed', 3)
ON CONFLICT (status) DO NOTHING;

INSERT INTO journey_items (id, label, route, description, image, status)
VALUES
  (1, 'Create CV', '/cv', 'CV Reminder', 'assets/images/coe.png', 'Not Started'),
  (2, 'ATCP Song Skills Matrix', '/skills-matrix', 'Track 2', 'assets/images/sustainability.png', 'Not Started'),
  (3, 'myCompetency', '/mycompetency', 'Add aspiration, experience, and skills', 'assets/images/diversity.png', 'Not Started'),
  (4, 'Update Contact', '/update-contact', 'Update Contact Details', 'assets/images/ai.png', 'Not Started'),
  (5, 'Workday', '/workday', 'Update your Contact details, Priorities, and People Lead', 'assets/images/ai.png', 'Not Started')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (task_type, title, description, url, status, progress, sort_order) VALUES
  ('journey', 'Create CV', 'Create a CV to communicate your value and make a strong first impression when a project opportunity rises.', '/my-cv', 'Not Started', 0, 1),
  ('journey', 'ATCP Song Skills Matrix', 'Help the ATCP Song organization to map your skills and skills levels so you can be matched to best clients.', '/my-skills-matrix', 'Not Started', 0, 2),
  ('journey', 'myCompentency', 'Select and assess your competency on your primary and secondary skills.', '/my-mycompetency', 'Not Started', 0, 3),
  ('journey', 'Update contact details', 'Update your primary and emergency contact details in our bench repository so we can reach out to you for important news and reminders.', '/my-update-contact', 'Not Started', 0, 4),
  ('journey', 'Update your Priorities in Workday', 'Update your priorities in Workday as well as take trainings and required learnings.', '/my-workday', 'Not Started', 0, 5),
  ('journey', 'Complete RIRO', 'Complete our Roll-in / Roll-off checklist in our repository as well as in the ATCP Bench Portal.', '/my-myriro', 'Not Started', 0, 6),
  ('journey', 'Update the Asset Tracker', 'Ensure that your workstation is properly accounted for by updating the ATCP Song Bench Asset Tracker.', '/my-asset-tracker', 'Not Started', 0, 7),
  ('journey', 'My Compliance', 'Complete the required compliance activities.', '/my-compliance', 'Not Started', 0, 8),
  ('journey', 'Update your People Lead in Workday', 'Update your people lead in Workday as well as take trainings and required learnings.', '/people-lead', 'Not Started', 0, 9),
  ('journey', 'Update your Contact Details in Workday', 'Update your primary and emergency contact details in Workday for BCM and other important notifications.', '/wd-update-contact', 'Not Started', 0, 10),
  ('journey', 'Register to Percipio, Pluralsight, and Udacity', 'Access learning materials and register your Accenture account with learning partners.', '/my-learning-platform', 'Not Started', 0, 11),
  ('journey', 'Complete all Training trackers', 'Update the training trackers in our repository.', '/training-tracker', 'Not Started', 0, 12),
  ('training', 'TQ Training on Udacity', '', 'https://www.udacity.com/learning-plan/tq-at-accenture', 'Not Started', 0, 1),
  ('training', 'Ethics and Compliance', '', 'https://wd103.myworkday.com/accenture/learning/viewmore/6964690f7fd810001c749ba92ee68ceb', 'Not Started', 0, 2),
  ('training', 'ISA Gold Advocate', '', 'https://in.accenture.com/protectingaccenture/dashboard/?referrer=mailer', 'Not Started', 0, 3),
  ('training', 'Green Software Engineering', '', 'https://connectedlearning.accenture.com/topics/green-software-engineering', 'Not Started', 0, 4),
  ('training', 'Gen AI Trainings', '', 'https://atci.lkm.delivery.accenture.com/TT/Automation/genAI', 'Not Started', 0, 5),
  ('training', 'Agentic AI Training', '', 'https://ts.accenture.com/:x:/r/sites/InteractiveBench/Shared%20Documents/General/02%20Trackers/FY26%20SONG%20Bench%20One%20Stop%20Tracker.xlsx', 'Not Started', 0, 6),
  ('training', 'Coding Standards', '', 'https://in.accenture.com/cioorganization/cio-bootcamp/cio-bootcamp-roles/developer/coding-standards/', 'Not Started', 0, 7)
ON CONFLICT (task_type, title) DO NOTHING;

INSERT INTO training_tasks (title, url, external_links)
SELECT title, url, jsonb_build_array(jsonb_build_object('text', title, 'url', url))
FROM tasks WHERE task_type = 'training'
ON CONFLICT (title) DO NOTHING;

INSERT INTO leadership_sections (section_name, item_id, payload) VALUES
  ('marketLeads', 1, $$ {"id":1,"name":"Erick Ona","role":"ATCP Song Lead / Song Asia Pacific","initials":"EO","photo":"assets/images/erick.charles.o.ona.png"} $$::jsonb),
  ('marketLeads', 2, $$ {"id":2,"name":"Diane Cussay","role":"Song EMEA and Americas","initials":"DC","photo":"assets/images/diane.r.p.cuasay.jpg"} $$::jsonb),
  ('practiceLeads', 1, $$ {"id":1,"category":"Commerce","name":"Meikko Moritz","initials":"MM","avatarColor":"#6b21a8","photo":null} $$::jsonb),
  ('practiceLeads', 2, $$ {"id":2,"category":"Design","name":"Noreena Lagmay","initials":"NL","photo":"assets/images/noreena.m.lagmay.png"} $$::jsonb),
  ('practiceLeads', 3, $$ {"id":3,"category":"Digital Products","name":"Jam Planta","initials":"JP","photo":"assets/images/joseph.k.s.planta.png"} $$::jsonb),
  ('practiceLeads', 4, $$ {"id":4,"category":"Digital Products","name":"Bogs Papuigan","initials":"BP","photo":"assets/images/bogard.t.paguigan.png"} $$::jsonb),
  ('enablementChampions', 1, $$ {"id":1,"name":"Noreena Lagmay","role":"Talent Creation Lead","initials":"NL","photo":"assets/images/noreena.m.lagmay.png"} $$::jsonb),
  ('enablementChampions', 2, $$ {"id":2,"name":"Cristina Bawal","role":"Business Operations","initials":"CB","avatarColor":"#6b21a8"} $$::jsonb),
  ('enablementChampions', 3, $$ {"id":3,"name":"Jeff Cruz","role":"Solutioning / Sales Support","initials":"JC","avatarColor":"#0369a1"} $$::jsonb),
  ('enablementChampions', 4, $$ {"id":4,"name":"Mea Somido","role":"HR Partner","initials":"MS","photo":"assets/images/maria.mea.somido.png"} $$::jsonb),
  ('enablementChampions', 5, $$ {"id":5,"name":"Vida R. Santos","role":"Recruitment Partner","initials":"VR","avatarColor":"#475569"} $$::jsonb),
  ('enablementChampions', 6, $$ {"id":6,"name":"Gladys Marquez","role":"TM Partner","initials":"GM","photo":"https://www.figma.com/api/mcp/asset/0d4437c7-5ddd-46b5-99ee-a11067ef8ac3"} $$::jsonb),
  ('enablementChampions', 7, $$ {"id":7,"name":"Madel Binondo / Eds Abuan","role":"Engagement","initials":"MB","photo":"assets/images/ma.l.c.binondo.png","coLead":{"name":"Eds Abuan","initials":"EA","photo":"assets/images/edwin.c.abuan.png"}} $$::jsonb),
  ('capabilityLeads', 1, $$ {"id":1,"category":"Commerce","groups":[{"subcategory":"Hybris","members":[{"name":"Bryan Mercado","initials":"BM","photo":"assets/images/dale.bryan.a.mercado.png"},{"name":"Robert Lee","initials":"RL","photo":"assets/images/robert.james.lee.png"}]},{"subcategory":"Salesforce","members":[{"name":"Cha Gaires","initials":"CG","avatarColor":"#475569"},{"name":"Vic Crisostomo","initials":"VC","photo":"assets/images/victor.t.crisostomo.png"}]},{"subcategory":"Adobe","members":[{"name":"Ramamar Salsona","initials":"RS","avatarColor":"#0369a1"}]}]} $$::jsonb),
  ('capabilityLeads', 2, $$ {"id":2,"category":"Design","groups":[{"subcategory":"Manila","members":[{"name":"Renz Bernardo","initials":"RB","photo":"assets/images/renz.p.i.bernardo.png"},{"name":"Ariel Poseria","initials":"AP","photo":"https://www.figma.com/api/mcp/asset/947f8013-756c-48db-b71e-68cbbcad7407"}]},{"subcategory":"Cebu","members":[{"name":"Lord Allen Hernandez","initials":"LA","avatarColor":"#0d9488","photo":"assets/images/lord.a.m.hernandez.png"}]}]} $$::jsonb),
  ('capabilityLeads', 3, $$ {"id":3,"category":"Digital Products","groups":[{"subcategory":"WEB","members":[{"name":"Francis Abuel","initials":"FA","photo":"assets/images/francis.j.abuel.png"}]},{"subcategory":"Mobile","members":[{"name":"Wenlyn Teorica","initials":"WT","avatarColor":"#15803d"}]}]} $$::jsonb),
  ('capabilityLeads', 4, $$ {"id":4,"category":"Adobe Marketing","groups":[{"subcategory":null,"members":[{"name":"Gail Mercado","initials":"GM","avatarColor":"#c2410c"},{"name":"Rupert Zach Pinzon","initials":"RZ","photo":"https://www.figma.com/api/mcp/asset/36f42d67-5d48-40b4-85ea-24433a5630fc"}]}]} $$::jsonb)
ON CONFLICT (section_name, item_id) DO NOTHING;

INSERT INTO home_spotlight (id, title) VALUES (1, 'Congratulations to our Newly-certified Full Stack Developers!')
ON CONFLICT (id) DO NOTHING;

INSERT INTO home_spotlight_people (id, payload) VALUES
  (1, $$ {"id":1,"displayName":"Ardione, David","fullName":"Ardione David","certification":"Certified Full Stack Developer","headshot":"assets/images/headshot-ardione-david.jpg.png","image":"assets/images/congrats3.png"} $$::jsonb),
  (2, $$ {"id":2,"displayName":"Bayona, Mark Anthony","fullName":"Mark Anthony Bayona","certification":"Certified Full Stack Developer","headshot":"assets/images/headshot-bayona-mark-anthony.jpg.png","image":"assets/images/congrats1.png"} $$::jsonb),
  (3, $$ {"id":3,"displayName":"Fernandez, Henry","fullName":"Henry Fernandez","certification":"Certified Full Stack Developer","headshot":"assets/images/headshot-fernandez-henry.jpg.png","image":"assets/images/congrats4.png"} $$::jsonb),
  (4, $$ {"id":4,"displayName":"Ignacio, Alison","fullName":"Alison Ignacio","certification":"Certified Full Stack Developer","headshot":"assets/images/headshot-ignacio-alison.jpg.png","image":"assets/images/congrats2.png"} $$::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO home_spotlights (display_name, full_name, certification, headshot_url, image_url, sort_order)
SELECT payload->>'displayName', payload->>'fullName', payload->>'certification', payload->>'headshot', payload->>'image', id - 1
FROM home_spotlight_people
ON CONFLICT (sort_order) DO NOTHING;

INSERT INTO home_announcements (icon, title, body, sort_order) VALUES
  ('notification', 'Important Trainings', 'Please complete the required training modules to ensure that you are up to date with the latest system processes and standards.', 1),
  ('star', 'New Feature', 'Certificate Gallery and animations have been added to make your experience more interactive and engaging.', 2),
  ('report', 'Important Notice', 'Please stay updated with the latest changes and announcements to ensure the best experience while using the application.', 3),
  ('bookmark', 'Reminder', 'Do not forget to check your latest updates and complete pending tasks to stay up to date with the system.', 4)
ON CONFLICT (sort_order) DO NOTHING;

INSERT INTO announcements (id, icon, title, body) VALUES
  (1, 'notification', 'Important Trainings', 'Please complete the required training modules to ensure that you are up to date with the latest system processes and standards.'),
  (2, 'star', 'New Feature', 'Certificate Gallery and animations have been added to make your experience more interactive and engaging.'),
  (3, 'report', 'Important Notice', 'Please stay updated with the latest changes and announcements to ensure the best experience while using the application.'),
  (4, 'bookmark', 'Reminder', 'Do not forget to check your latest updates and complete pending tasks to stay up to date with the system.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO song_link_groups (title, sort_order) VALUES
  ('Learn more about Song', 1), ('Other important links', 2)
ON CONFLICT (sort_order) DO NOTHING;

INSERT INTO song_link_sections (id, title) VALUES
  (1, 'Learn more about Song'), (2, 'Other important links')
ON CONFLICT (id) DO NOTHING;

INSERT INTO song_links (group_id, title, description, link_text, url, external_link, sort_order)
SELECT g.id, v.title, v.description, v.link_text, v.url, v.external_link, v.sort_order
FROM song_link_groups g
JOIN (VALUES
  ('Learn more about Song', 'ATCP Song Leadership', 'Leadership content', 'ATCP Song Leadership', '/atcp-song', false, 1),
  ('Learn more about Song', 'ATCP Song Viva Engage', 'ATCP Song community', 'Viva Engage: ATCP Song', 'https://engage.cloud.microsoft/', true, 2),
  ('Learn more about Song', 'ATCP Song Technologies', 'Technology content', 'ATCP Song Technologies', '/song3', false, 3),
  ('Learn more about Song', 'ATCP Song Bench', 'Bench resources', 'ATCP Song Bench', '/song-bench', false, 4),
  ('Other important links', 'Accenture Song', 'Customer-facing design and creative arm of Accenture.', 'Accenture Song', '#', true, 1),
  ('Other important links', 'Accenture Support', 'Centralized self-service support.', 'Accenture Support', 'https://support.accenture.com', true, 2),
  ('Other important links', 'Buhay Accenture', 'Official internal site for Accenture in the Philippines.', 'Buhay Accenture', 'https://in.accenture.com/philippines/', true, 3),
  ('Other important links', 'IS Advocate', 'Information Security Advocate Dashboard.', 'IS Advocate Dashboard', 'https://isadvocate.accenture.com/', true, 4),
  ('Other important links', 'MyTE: My Time and Expenses', 'Record time and submit expenses.', 'MyTE', 'https://myte.accenture.com/', true, 5),
  ('Other important links', 'Philippine Employee Self-service Hub (PESH)', 'One-stop hub for Philippines employees.', 'PESH', 'https://pesh.accenture.com/home', true, 6),
  ('Other important links', 'Workday: ABCD Reflection', 'ABCD self-reflections.', 'Workday: ABCD Reflection', 'https://wd103.myworkday.com/accenture/d/task/12709$1289.htmld', true, 7),
  ('Other important links', 'Workday: CV', 'Create or generate a CV in Workday.', 'Workday: CV', 'https://wd103.myworkday.com/accenture/d/task/2998$2739.htmld', true, 8),
  ('Other important links', 'Workday: Skills and Specialization', 'Map employee skills and experience.', 'Workday: Skills and Specialization', 'https://wd103.myworkday.com/accenture/d/task/2998$2739.htmld', true, 9),
  ('Other important links', 'Workday: Trainings', 'Search, enroll, and track learning.', 'Workday: Trainings', 'https://wd103.myworkday.com/accenture/learning', true, 10)
) AS v(group_title, title, description, link_text, url, external_link, sort_order)
  ON v.group_title = g.title
ON CONFLICT (group_id, sort_order) DO NOTHING;

INSERT INTO song_link_cards (section_id, card_id, payload)
SELECT s.id, l.sort_order, jsonb_build_object('title', l.title, 'description', l.description, 'linkText', l.link_text, 'url', l.url, 'external', l.external_link)
FROM song_links l
JOIN song_link_groups g ON g.id = l.group_id
JOIN song_link_sections s ON s.title = g.title
ON CONFLICT (section_id, card_id) DO NOTHING;
