-- The company's compote (1 l, 120 som) joins the catalog; nothing changes if
-- it is already there (e.g. added in the admin panel or by the seed).
INSERT INTO "products" ("id", "sku", "slug", "type", "status", "price_amount", "currency",
  "stock_quantity", "track_inventory", "is_featured", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), 'KOMPOT', 'kompot', 'FOOD', 'ACTIVE', 12000, 'KGS', 0, false, false, 100, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "slug" = 'kompot' OR "sku" = 'KOMPOT');

INSERT INTO "product_translations" ("id", "product_id", "locale", "name")
SELECT gen_random_uuid(), p."id", l."locale", 'Компот'
FROM "products" p CROSS JOIN (VALUES ('ru'), ('ky')) AS l("locale")
WHERE p."slug" = 'kompot'
  AND NOT EXISTS (SELECT 1 FROM "product_translations" t WHERE t."product_id" = p."id" AND t."locale" = l."locale");

INSERT INTO "product_units" ("id", "product_id", "unit_name", "quantity_value", "quantity_unit", "created_at", "updated_at")
SELECT gen_random_uuid(), p."id", 'Литр', 1, 'л', now(), now()
FROM "products" p
WHERE p."slug" = 'kompot'
  AND NOT EXISTS (SELECT 1 FROM "product_units" u WHERE u."product_id" = p."id");

-- Honey: 250 g jar (as on the label), when no size was entered yet.
INSERT INTO "product_units" ("id", "product_id", "unit_name", "quantity_value", "quantity_unit", "created_at", "updated_at")
SELECT gen_random_uuid(), p."id", 'Грамм', 250, 'г', now(), now()
FROM "products" p
WHERE p."slug" = 'bal'
  AND NOT EXISTS (SELECT 1 FROM "product_units" u WHERE u."product_id" = p."id");
