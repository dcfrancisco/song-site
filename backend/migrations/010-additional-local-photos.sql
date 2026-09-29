UPDATE leadership_sections
SET payload = json_set(payload, '$.photo', 'assets/images/bogard.t.paguigan.png')
WHERE section_name = 'practiceLeads'
  AND item_id = 4;

UPDATE leadership_sections
SET payload = json_set(
  json_set(
    json_set(payload, '$.groups[0].members[0].photo', 'assets/images/dale.bryan.a.mercado.png'),
    '$.groups[0].members[1].photo', 'assets/images/robert.james.lee.png'
  ),
  '$.groups[1].members[1].photo', 'assets/images/victor.t.crisostomo.png'
)
WHERE section_name = 'capabilityLeads'
  AND item_id = 1;

UPDATE leadership_sections
SET payload = json_set(payload, '$.photo', 'assets/images/maria.mea.somido.png')
WHERE section_name = 'enablementChampions'
  AND item_id = 4;

UPDATE leadership_sections
SET payload = json_set(
  json_set(payload, '$.photo', 'assets/images/ma.l.c.binondo.png'),
  '$.coLead.photo', 'assets/images/edwin.c.abuan.png'
)
WHERE section_name = 'enablementChampions'
  AND item_id = 7;