UPDATE leadership_sections
SET payload = json_set(payload, '$.photo', 'assets/images/erick.charles.o.ona.png')
WHERE section_name = 'marketLeads'
  AND item_id = 1;
