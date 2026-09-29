UPDATE leadership_sections
SET payload = jsonb_set(payload, '{photo}', to_jsonb('assets/images/noreena.m.lagmay.png'::text), true)
WHERE section_name = 'practiceLeads'
  AND item_id = 2;

UPDATE leadership_sections
SET payload = jsonb_set(payload, '{photo}', to_jsonb('assets/images/noreena.m.lagmay.png'::text), true)
WHERE section_name = 'enablementChampions'
  AND item_id = 1;