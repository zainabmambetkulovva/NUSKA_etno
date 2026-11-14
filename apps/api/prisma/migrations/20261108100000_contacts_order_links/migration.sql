-- Data: links provided by the company (wholesale and retail order forms, city).
-- Only keys that are not set yet are added, so edits made in the admin panel are kept.
UPDATE "site_content"
SET "data" = jsonb_build_object(
      'address', 'Бишкек, Кыргызстан',
      'wholesale', 'https://project23274583.tilda.ws/nuska_etno',
      'retail', 'https://project23274583.tilda.ws/nuska_etno0'
    ) || COALESCE("data", '{}'::jsonb),
    "updated_at" = CURRENT_TIMESTAMP
WHERE "key" = 'contacts';
