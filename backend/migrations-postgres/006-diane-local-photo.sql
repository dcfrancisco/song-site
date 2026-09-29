UPDATE leadership_sections
SET payload = jsonb_set(payload, '{photo}', to_jsonb('assets/images/diane.r.p.cuasay.jpg'::text), true)
WHERE section_name = 'marketLeads'
  AND item_id = 2;