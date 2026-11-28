-- «About us» page text, as provided by the company (Kyrgyz) with a Russian translation.
-- Replaces the one-line placeholder; it can still be edited in the admin panel.
INSERT INTO "site_content" ("id", "key", "data", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'about', NULL, true, now(), now())
ON CONFLICT ("key") DO UPDATE SET "is_active" = true, "updated_at" = now();

INSERT INTO "site_content_translations" ("id", "site_content_id", "locale", "title", "body")
SELECT gen_random_uuid(), c."id", v."locale", v."title", v."body"
FROM "site_content" c
CROSS JOIN (VALUES
  ('ky', 'Биз жөнүндө', $ky$NUSKA_ETNO — кыргыз элинин улуттук баалуулуктарын жана салттуу даамдарын даңазалаган, табигый азыктарды сунуштоочу бренд.

Биздин негизги максатыбыз — улуттук мурасты сактоо менен бирге, сапаттуу жана табигый азыктарды керектөөчүлөргө жеткирүү. Биз табияттын тазалыгын, ата-бабаларыбыздан калган салттарды жана туура тамактануу маданиятын жогору баалайбыз.

Биз үчүн сапат, табигыйлык жана кардарлардын ишеними — эң негизги баалуулуктар. Улуттук даамдарды заманбап жашоо менен айкалыштырып, ар бир үй-бүлөнүн дасторконуна береке тартуулоого умтулабыз.

NUSKA_ETNO — табигый тазалык, улуттук даам, муундан муунга өткөн баалуулук.$ky$),
  ('ru', 'О нас', $ru$NUSKA_ETNO — бренд, воспевающий национальные ценности и традиционные вкусы кыргызского народа и предлагающий натуральные продукты.

Наша главная цель — сохраняя национальное наследие, доставлять потребителям качественные и натуральные продукты. Мы высоко ценим чистоту природы, традиции, доставшиеся нам от предков, и культуру правильного питания.

Для нас качество, натуральность и доверие клиентов — главные ценности. Сочетая национальные вкусы с современной жизнью, мы стремимся принести береке (достаток и благополучие) на дастархан каждой семьи.

NUSKA_ETNO — природная чистота, национальный вкус, ценность, передающаяся из поколения в поколение.$ru$)
) AS v("locale", "title", "body")
WHERE c."key" = 'about'
ON CONFLICT ("site_content_id", "locale") DO UPDATE
SET "title" = EXCLUDED."title", "body" = EXCLUDED."body";
