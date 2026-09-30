UPDATE leadership_sections
SET payload = json_set(payload, '$.groups[0].members[0].photo', 'assets/images/renz.p.i.bernardo.png')
WHERE section_name = 'capabilityLeads'
  AND item_id = 2;