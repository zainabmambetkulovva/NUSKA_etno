-- The company works by delivery only and has no street address to show:
-- drop the old placeholder address from the contacts block (data only).
UPDATE "site_content"
SET "data" = "data" - 'address'
WHERE "key" = 'contacts' AND "data" IS NOT NULL;
