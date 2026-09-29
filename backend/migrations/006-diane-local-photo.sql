UPDATE leadership_sections
SET payload = json_set(payload, '$.photo', 'assets/images/diane.r.p.cuasay.jpg')
WHERE section_name = 'marketLeads'
  AND item_id = 2;