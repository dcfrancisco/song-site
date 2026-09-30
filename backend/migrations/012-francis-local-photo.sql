UPDATE leadership_sections
SET payload = json_set(payload, '$.groups[0].members[0].photo', 'assets/images/francis.j.abuel.png')
WHERE section_name = 'capabilityLeads'
  AND item_id = 3;