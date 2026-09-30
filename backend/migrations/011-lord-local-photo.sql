UPDATE leadership_sections
SET payload = json_set(payload, '$.groups[1].members[0].photo', 'assets/images/lord.a.m.hernandez.png')
WHERE section_name = 'capabilityLeads'
  AND item_id = 2;