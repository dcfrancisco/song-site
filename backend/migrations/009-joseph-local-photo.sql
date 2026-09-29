UPDATE leadership_sections
SET payload = json_set(payload, '$.photo', 'assets/images/joseph.k.s.planta.png')
WHERE section_name = 'practiceLeads'
  AND item_id = 3;