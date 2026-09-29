UPDATE leadership_sections
SET payload = jsonb_set(payload, '{photo}', to_jsonb('assets/images/erick.charles.o.ona.png'::text), true)
WHERE section_name = 'marketLeads'
  AND item_id = 1;