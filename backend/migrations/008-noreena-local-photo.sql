UPDATE leadership_sections
SET payload = json_set(payload, '$.photo', 'assets/images/noreena.m.lagmay.png')
WHERE section_name = 'practiceLeads'
  AND item_id = 2;

UPDATE leadership_sections
SET payload = json_set(payload, '$.photo', 'assets/images/noreena.m.lagmay.png')
WHERE section_name = 'enablementChampions'
  AND item_id = 1;