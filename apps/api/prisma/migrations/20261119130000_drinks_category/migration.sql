-- «Суусундуктар / Напитки» for the compote (only what is missing is added).
INSERT INTO "categories" ("id", "slug", "sort_order", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid(), 'drinks', 6, true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "slug" = 'drinks');

INSERT INTO "category_translations" ("id", "category_id", "locale", "name")
SELECT gen_random_uuid(), c."id", l."locale", l."name"
FROM "categories" c
CROSS JOIN (VALUES ('ru', 'Напитки'), ('ky', 'Суусундуктар')) AS l("locale", "name")
WHERE c."slug" = 'drinks'
  AND NOT EXISTS (
    SELECT 1 FROM "category_translations" t WHERE t."category_id" = c."id" AND t."locale" = l."locale"
  );

-- the compote goes into it, unless it already has a category
INSERT INTO "product_categories" ("product_id", "category_id", "created_at")
SELECT p."id", c."id", now()
FROM "products" p, "categories" c
WHERE p."slug" = 'kompot' AND c."slug" = 'drinks'
  AND NOT EXISTS (SELECT 1 FROM "product_categories" pc WHERE pc."product_id" = p."id");
