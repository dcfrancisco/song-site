-- Align PostgreSQL Journey and training seed records with the SQLite source data.
-- Status, progress, and timestamps are intentionally preserved for existing rows.

UPDATE tasks SET
  description = CASE title
    WHEN 'Create CV' THEN 'Create a CV to communicate your value and make a strong first impression when a project opportunity rises.'
    WHEN 'ATCP Song Skills Matrix' THEN 'Help the ATCP Song organization to map your skills and skills levels so you can be matched to best clients.'
    WHEN 'myCompentency' THEN 'Select and assess your competency on your primary and secondary skills.'
    WHEN 'Update contact details' THEN 'Update your primary and emergency contact details in our bench repository so we can reach out to you for important news and reminders.'
    WHEN 'Update your Priorities in Workday' THEN 'Update your priorities in Workday as well as take trainings and required learnings.'
    WHEN 'Complete RIRO' THEN 'Complete our Roll-in / Roll-off (RIRO) checklist in our repository as well as in the ATCP Bench Portal.'
    WHEN 'Update the Asset Tracker' THEN 'Ensure that your workstation is properly accounted for by updating the ATCP Song Bench Asset Tracker.'
    WHEN 'My Compliance' THEN 'Create a CV to communicate your value and make a strong first impression when a project opportunity rises.'
    WHEN 'Update your People Lead in Workday' THEN 'Update your people lead in workday as well as take trainings and required learnings.'
    WHEN 'Update your Contact Details in Workday' THEN 'Update your primary and emergency contact details in Workday for BCM and other important notifications.'
    WHEN 'Register to Percipio, Pluralsight, and Udacity' THEN 'Access thousands of training materials and build your capability by registering your Accenture account with our learning partners Percipio, Pluralsight, and Udacity.'
    WHEN 'Complete all Training trackers' THEN 'Update the training trackers in our repository so we can account which trainings are need to be taken, in-progress, or completed.'
    ELSE description
  END,
  url = CASE title
    WHEN 'Create CV' THEN '/my-cv'
    WHEN 'ATCP Song Skills Matrix' THEN '/my-skills-matrix'
    WHEN 'myCompentency' THEN '/my-mycompetency'
    WHEN 'Update contact details' THEN '/my-update-contact'
    WHEN 'Update your Priorities in Workday' THEN '/my-workday'
    WHEN 'Complete RIRO' THEN '/my-myriro'
    WHEN 'Update the Asset Tracker' THEN '/my-asset-tracker'
    WHEN 'My Compliance' THEN '/my-compliance'
    WHEN 'Update your People Lead in Workday' THEN '/people-lead'
    WHEN 'Update your Contact Details in Workday' THEN '/wd-update-contact'
    WHEN 'Register to Percipio, Pluralsight, and Udacity' THEN '/my-learning-platform'
    WHEN 'Complete all Training trackers' THEN '/training-tracker'
    WHEN 'TQ Training on Udacity' THEN 'https://www.udacity.com/learning-plan/tq-at-accenture'
    WHEN 'Ethics and Compliance' THEN 'https://wd103.myworkday.com/accenture/learning/viewmore/6964690f7fd810001c749ba92ee68ceb'
    WHEN 'ISA Gold Advocate' THEN 'https://in.accenture.com/protectingaccenture/dashboard/?referrer=mailer'
    WHEN 'Green Software Engineering' THEN 'https://connectedlearning.accenture.com/topics/green-software-engineering'
    WHEN 'Gen AI Trainings' THEN 'https://atci.lkm.delivery.accenture.com/TT/Automation/genAI'
    WHEN 'Agentic AI Training' THEN 'https://ts.accenture.com/:x:/r/sites/InteractiveBench/Shared%20Documents/General/02%20Trackers/FY26%20SONG%20Bench%20One%20Stop%20Tracker.xlsx?d=w090b48a6d4d9403bbc863cc06d0907d7&csf=1&web=1&e=SrLFfs'
    WHEN 'Coding Standards' THEN 'https://in.accenture.com/cioorganization/cio-bootcamp/cio-bootcamp-roles/developer/coding-standards/'
    ELSE url
  END
WHERE task_type IN ('journey', 'training');

DELETE FROM task_links
WHERE task_id IN (SELECT id FROM tasks WHERE task_type IN ('journey', 'training'));

WITH seeded_links(task_title, link_text, url, sort_order) AS (
  VALUES
    ('Create CV', 'ATCP Song Bench CV Template', 'https://ts.accenture.com/sites/InteractiveBench/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FInteractiveBench%2FShared%20Documents%2FGeneral%2F01%20Onboarding%20Documents%2FCV%2F%5BNEW%5D%20Manila&viewid=74113734%2D093e%2D4882%2Db4ce%2Dcd5ba3489b92', 1),
    ('Create CV', 'ATCP Song Bench CV Repository', 'https://ts.accenture.com/sites/InteractiveBench/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FInteractiveBench%2FShared%20Documents%2FGeneral%2F01%20Onboarding%20Documents%2FCV&viewid=74113734%2D093e%2D4882%2Db4ce%2Dcd5ba3489b92', 2),
    ('ATCP Song Skills Matrix', 'ATCP Song Skills Matrix', 'https://ts.accenture.com/:x:/r/sites/InteractiveBench/_layouts/15/Doc.aspx?sourcedoc=%7BD0BFCA08-72A7-4D98-A4DE-C4BBA8E1F9CE%7D&file=ATCP%20Song%20Skills%20Matrix.xlsx&action=default&mobileredirect=true', 1),
    ('myCompentency', 'myCompetency', 'https://mycompetency.accenture.com/#/home', 1),
    ('Update contact details', 'Update contact details', 'https://ts.accenture.com/:x:/s/InteractiveBench/Ea8eyvc-Nz9Jp4VZXt7BJC0BQphNTKjF7J1OAkX3wWLOsQ?e=CMYbAo.', 1),
    ('Update your Priorities in Workday', 'Workday', 'https://wd103.myworkday.com/accenture/d/task/2998$46108.htmld', 1),
    ('Complete RIRO', 'RIRO', 'https://roro.clientdataprotection.accenture.com/RORO.aspx', 1),
    ('Update the Asset Tracker', 'Asset Tracker', 'https://ts.accenture.com/:x:/s/InteractiveBench/EXhaA23geO9GsZAw0H-zOyMBGzLVYnYM4vaaIkW3alkNvQ?e=i4uhaZ', 1),
    ('My Compliance', 'My Compliance', 'https://ts.accenture.com/:x:/s/InteractiveBench/EXhaA23geO9GsZAw0H-zOyMBGzLVYnYM4vaaIkW3alkNvQ?e=i4uhaZ', 1),
    ('Update your People Lead in Workday', 'Workday', 'https://wd103.myworkday.com/accenture/d/home.htmld', 1),
    ('Update your Contact Details in Workday', 'Workday', 'https://wd103.myworkday.com/accenture/d/home.htmld', 1),
    ('Register to Percipio, Pluralsight, and Udacity', 'Accenture Percipio site', 'https://accenture.percipio.com/', 1),
    ('Register to Percipio, Pluralsight, and Udacity', 'Pluralsight site', 'https://app.pluralsight.com/id/signin?redirectTo=https%3A%2F%2Fapp.pluralsight.com%2Flibrary%2Ffree', 2),
    ('Register to Percipio, Pluralsight, and Udacity', 'Udacity Site', 'https://auth.udacity.com/sign-in?next=https://www.udacity.com/dashboard', 3),
    ('Register to Percipio, Pluralsight, and Udacity', 'Udacity: TQ at Accenture', 'https://www.udacity.com/accenture', 4),
    ('Complete all Training trackers', 'Training Tracker', '/training-tracker', 1),
    ('TQ Training on Udacity', 'TQ Training on Udacity', 'https://www.udacity.com/learning-plan/tq-at-accenture', 1),
    ('Ethics and Compliance', 'Ethics and Compliance', 'https://wd103.myworkday.com/accenture/learning/viewmore/6964690f7fd810001c749ba92ee68ceb', 1),
    ('ISA Gold Advocate', 'ISA Gold Advocate', 'https://in.accenture.com/protectingaccenture/dashboard/?referrer=mailer', 1),
    ('Green Software Engineering', 'Green Software Engineering', 'https://connectedlearning.accenture.com/topics/green-software-engineering', 1),
    ('Gen AI Trainings', 'Gen AI Trainings', 'https://atci.lkm.delivery.accenture.com/TT/Automation/genAI', 1),
    ('Agentic AI Training', 'Agentic AI Training', 'https://ts.accenture.com/:x:/r/sites/InteractiveBench/Shared%20Documents/General/02%20Trackers/FY26%20SONG%20Bench%20One%20Stop%20Tracker.xlsx?d=w090b48a6d4d9403bbc863cc06d0907d7&csf=1&web=1&e=SrLFfs', 1),
    ('Coding Standards', 'Coding Standards', 'https://in.accenture.com/cioorganization/cio-bootcamp/cio-bootcamp-roles/developer/coding-standards/', 1)
)
INSERT INTO task_links (task_id, link_text, url, sort_order)
SELECT t.id, seeded_links.link_text, seeded_links.url, seeded_links.sort_order
FROM seeded_links
JOIN tasks t ON t.title = seeded_links.task_title
WHERE t.task_type IN ('journey', 'training');
