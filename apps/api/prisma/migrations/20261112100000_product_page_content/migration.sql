-- Product pages: a "benefits" list and first draft texts (see prisma/product-content.json).
-- The texts only fill EMPTY fields; anything edited in the admin panel is kept.
ALTER TABLE "product_translations" ADD COLUMN "benefits" TEXT;

-- sary-mai (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Сары май — сүт майын акырындык менен эритип, ичиндеги сууну буулантып даярдалуучу кыргыздардын салттуу азыгы (топлёное масло, «ги»). Анын өзүнө таандык бай даамы жана жыты бар. Нанга жагып, ботко, ашка жана камырга кошуп, ошондой эле кууруу үчүн колдонулат.'),
  "ingredients" = COALESCE(pt."ingredients", 'Сүт майы (эритилген сары май). Таңгактагы этикеткага ылайык — 100% табигый продукт.'),
  "benefits" = COALESCE(pt."benefits", 'Табигый сүт майынан даярдалган, этикеткасында «100% табигый продукт» деп көрсөтүлгөн
Жогорку температурада күйүп кетпейт — кууруу жана бышыруу үчүн ылайыктуу
Суусу буулантылгандыктан кадимки сары майга караганда узагыраак сакталат
Бай даам жана жыт: тамакка аз өлчөм кошсоңуз да жетиштүү
Нанга, ботко, камырга жана улуттук тамактарга ылайыктуу')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('sary-mai');

-- sary-mai (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Сары май — топлёное масло: молочный жир медленно вытапливают, пока не испарится вода, и остаётся чистый, насыщенный по вкусу и аромату продукт (гхи). Его намазывают на хлеб, добавляют в каши, плов и тесто, на нём жарят.'),
  "ingredients" = COALESCE(pt."ingredients", 'Молочный жир (топлёное масло). По этикетке на упаковке — 100% натуральный продукт.'),
  "benefits" = COALESCE(pt."benefits", 'Из натурального молочного жира, на этикетке указано «100% натуральный продукт»
Не подгорает при сильном нагреве — подходит для жарки и выпечки
Вода выпарена, поэтому хранится дольше обычного сливочного масла
Насыщенный вкус и аромат: достаточно небольшого количества
Подходит для хлеба, каш, теста и национальных блюд')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('sary-mai');

-- kymyz (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Кымыз — бээ сүтүн ачытып даярдалуучу кыргыз элинин байыркы улуттук суусундугу. Муздак, жеңил көбүктүү, ачуу-таттуу даамы бар. Жайкы дасторконго, мейман күтүүгө жана майрамдарга салттуу түрдө коюлат.'),
  "ingredients" = COALESCE(pt."ingredients", 'Ачытылган бээ сүтү. Толук курамы — бөтөлкөнүн этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Табигый ачытуу жолу менен даярдалган кылымдардын салттуу суусундугу
Табигый, жеңил сиңүүчү азык катары бааланат
Жайкы ысыкта сергитет жана суусунду кандырат
Мейман күтүүдө жана майрамдарда дасторкондун өзгөчө суусундугу')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('kymyz');

-- kymyz (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Кымыз — древний национальный напиток кыргызов, который готовят из кобыльего молока методом брожения. У него прохладный, слегка игристый кисло-сладкий вкус. По традиции его подают к летнему дастархану, гостям и на праздники.'),
  "ingredients" = COALESCE(pt."ingredients", 'Заквашенное кобылье молоко. Полный состав — на этикетке бутылки.'),
  "benefits" = COALESCE(pt."benefits", 'Готовится естественным брожением по традиции, проверенной веками
Ценится как натуральный, легко усваиваемый продукт
Освежает в летнюю жару и хорошо утоляет жажду
Особый напиток для гостей и праздничного стола')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('kymyz');

-- navat (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Нават — кант сиропун кристаллдаштыруу жолу менен даярдалуучу кыргыздардын салттуу таттуусу. Янтарь түстөгү тунук кристаллдары чай менен бирге берилет, ошондой эле чайга кант ордуна салууга болот. Өлчөмү боюнча үч түрдүү таңгакта сатылат.'),
  "ingredients" = COALESCE(pt."ingredients", 'Кант (кристаллдаштырылган кант сиропу). Толук курамы — таңгактын этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Салттуу улуттук таттуу — чай дасторконунун кооз кошумчасы
Чайга кант ордуна салууга болот
Кристаллдары тунук жана кооз — белек топтомуна ылайыктуу
Үч өлчөмдөгү таңгак: үй-бүлөгө да, мейманга да')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('navat-0-5', 'navat-0-6', 'navat-0-7');

-- navat (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Нават — традиционная кыргызская сладость: кристаллизованный сахарный сироп. Прозрачные янтарные кристаллы подают к чаю, ими же можно подсластить чай вместо сахара. Продаётся в трёх фасовках.'),
  "ingredients" = COALESCE(pt."ingredients", 'Сахар (кристаллизованный сахарный сироп). Полный состав — на этикетке упаковки.'),
  "benefits" = COALESCE(pt."benefits", 'Традиционная национальная сладость — красивое дополнение к чаю
Можно класть в чай вместо сахара
Прозрачные кристаллы выглядят нарядно — хорошо подходит в подарок
Три фасовки: и для семьи, и для гостей')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('navat-0-5', 'navat-0-6', 'navat-0-7');

-- besh-barmak (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Беш бармак — кыргыздын башкы улуттук тамагы. Биздин улуттук беш бармактын камыры (кесме) даяр: аны эт менен бирге бышырсаңыз эле, дасторконго койсо болот.'),
  "ingredients" = COALESCE(pt."ingredients", 'Негизинен буудай унунан жасалган камыр. Толук курамы — таңгактын этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Даяр камыр: убакытты үнөмдөйт — эт менен бышырып, дароо дасторконго коюңуз
Салттуу кесме — беш бармактын негизги бөлүгү
Күнүмдүк тамакка да, мейманга да ыңгайлуу
Таңгакта сакталат, керектүү учурда бышырууга даяр')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('besh-barmak');

-- besh-barmak (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Бешбармак — главное национальное блюдо кыргызов. Наша лапша для национального бешбармака уже готова к варке: сварите её с мясом, и блюдо можно подавать к столу.'),
  "ingredients" = COALESCE(pt."ingredients", 'Тесто, главным образом из пшеничной муки. Полный состав — на этикетке упаковки.'),
  "benefits" = COALESCE(pt."benefits", 'Готовое тесто экономит время: варите с мясом и сразу подавайте
Традиционная нарезка — основа настоящего бешбармака
Подходит и для повседневного стола, и для гостей
В упаковке хранится до того момента, когда понадобится')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('besh-barmak');

-- kattama (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Каттама — катмар-катмар жасалган, жумшак жана куурулган салттуу кыргыз жалпак наны. Чай менен, сары май жана бал менен айрыкча даамдуу.'),
  "ingredients" = COALESCE(pt."ingredients", 'Негизинен буудай унунан даярдалган. Толук курамы — таңгактын этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Катмар-катмар жумшак түзүлүшү бар салттуу нан
Чай менен, сары май жана бал менен жарашат
Күнүмдүк дасторконго да, мейманга да ыңгайлуу')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('kattama');

-- kattama (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Каттама — традиционная кыргызская слоёная лепёшка: мягкая, обжаренная, из тонких слоёв. Особенно вкусна к чаю, с сары май и мёдом.'),
  "ingredients" = COALESCE(pt."ingredients", 'Готовится главным образом из пшеничной муки. Полный состав — на этикетке упаковки.'),
  "benefits" = COALESCE(pt."benefits", 'Традиционная лепёшка с мягкой слоистой структурой
Хорошо сочетается с чаем, сары май и мёдом
Подходит и для повседневного стола, и для гостей')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('kattama');

-- zhupka (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Жупка — жука жайылган камырдан бышырылган салттуу кыргыз азыгы. NUSKA_etno таңгагында «Кыргызстандын салттуу продуктусу» деп жазылган. Чай менен, сорпо менен же өз алдынча жесе болот.'),
  "ingredients" = COALESCE(pt."ingredients", 'Негизинен буудай унунан даярдалган. Толук курамы — таңгактын этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Жука жана жеңил — салттуу кыргыз жупкасы
Чай менен, сорпо менен же өз алдынча жесе болот
Дасторконго жана жолго ыңгайлуу таңгак
Таңгагында «100% табигый продукт» деп көрсөтүлгөн')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('zhupka');

-- zhupka (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Жупка — традиционный кыргызский продукт из тонко раскатанного теста. На упаковке NUSKA_etno указано: «Традиционный продукт Кыргызстана». Её едят с чаем, с бульоном или просто так.'),
  "ingredients" = COALESCE(pt."ingredients", 'Готовится главным образом из пшеничной муки. Полный состав — на этикетке упаковки.'),
  "benefits" = COALESCE(pt."benefits", 'Тонкая и лёгкая — настоящая кыргызская жупка
Подходит к чаю, к бульону и как самостоятельное угощение
Удобная упаковка для стола и в дорогу
На упаковке указано «100% натуральный продукт»')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('zhupka');

-- bal (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Бал — аарылар чогултуп жасаган табигый таттуу. Чай менен, нан менен, ботко жана десерттерге коюлат. Түсү жана даамы чогултулган жерине жана мезгилине жараша өзгөрүшү мүмкүн — бул табигый балга мүнөздүү.'),
  "ingredients" = COALESCE(pt."ingredients", 'Табигый аары балы. Толук курамы жана чыккан жери — банканын этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Табигый таттуу: чайга, ботко, нанга жана десертке
Түсү жана даамы мезгилге жараша ар башка болот — бул табигый бал үчүн мүнөздүү
Кичинекей банкада — үйгө жана белекке ыңгайлуу')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('bal');

-- bal (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Мёд — натуральная сладость, которую собирают пчёлы. Его подают к чаю, хлебу, кашам и десертам. Цвет и вкус могут отличаться в зависимости от места и времени сбора — это нормально для натурального мёда.'),
  "ingredients" = COALESCE(pt."ingredients", 'Натуральный пчелиный мёд. Полный состав и место сбора — на этикетке банки.'),
  "benefits" = COALESCE(pt."benefits", 'Натуральная сладость: к чаю, кашам, хлебу и десертам
Цвет и вкус зависят от сезона сбора — это свойство настоящего мёда
Удобная банка для дома и в подарок')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('bal');

-- kholodets (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Килкилдек (холодец) — этти узак бышырып, муздатып даярдалуучу муздак тамак. Майрамдык жана күнүмдүк дасторконго коюлат.'),
  "ingredients" = COALESCE(pt."ingredients", 'Эт жана эттин сорпосу. Толук курамы — таңгактын этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Даяр муздак тамак — убакытты үнөмдөйт
Майрамдык дасторконго да, күнүмдүк тамакка да ылайыктуу
Ысытпай эле дароо жесе болот')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('kholodets');

-- kholodets (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Килкилдек (холодец) — холодное блюдо из долго сваренного мяса, застывшего в бульоне. Его подают на праздничный и повседневный стол.'),
  "ingredients" = COALESCE(pt."ingredients", 'Мясо и мясной бульон. Полный состав — на этикетке упаковки.'),
  "benefits" = COALESCE(pt."benefits", 'Готовая холодная закуска — экономит время
Подходит и для праздничного, и для повседневного стола
Можно есть сразу, без разогрева')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('kholodets');

-- keremet-classic (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Керемет шыпаа — табигый суттон даярдалган ферменттелген (ачытылган) суусундук. NUSKA_etno өзүнүн постунда аны «улуттук даамдын өзгөчөлүгү» деп сунуштайт. Бул — классикалык түрү.'),
  "ingredients" = COALESCE(pt."ingredients", 'Табигый сүт (ферменттелген суусундук). Толук курамы — бөтөлкөнүн этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Табигый суттон ферменттелип даярдалат
Улуттук даамдын өзгөчөлүгү
Бөтөлкөдө — үйдө да, жолдо да ичүүгө ыңгайлуу')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('keremet-shypaa-klassika');

-- keremet-classic (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Керемет шыпаа — ферментированный (заквашенный) напиток из натурального молока. В своём посте NUSKA_etno называет его «особенностью национального вкуса». Это классический вариант.'),
  "ingredients" = COALESCE(pt."ingredients", 'Натуральное молоко (ферментированный напиток). Полный состав — на этикетке бутылки.'),
  "benefits" = COALESCE(pt."benefits", 'Готовится из натурального молока методом ферментации
Особенность национального вкуса
В бутылке — удобно и дома, и в дороге')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('keremet-shypaa-klassika');

-- keremet-chychyrkanak (ky)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Керемет шыпаа — табигый суттон даярдалган ферменттелген суусундук. Бул түрү чычырканак менен даярдалат. NUSKA_etno постунда чычырканак — С витаминдин булагы, ал эми дан азыктары — В тобундагы витаминдердин булагы болушу мүмкүн деп көрсөтүлгөн.'),
  "ingredients" = COALESCE(pt."ingredients", 'Табигый сүт, чычырканак (ферменттелген суусундук). Толук курамы — бөтөлкөнүн этикеткасында.'),
  "benefits" = COALESCE(pt."benefits", 'Чычырканак — С витаминдин булагы (NUSKA_etno постунда)
Дан азыктары — В тобундагы витаминдердин булагы болушу мүмкүн (NUSKA_etno постунда)
Табигый суттон ферменттелип даярдалат
Улуттук даамдын өзгөчөлүгү')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ky' AND p."slug" IN ('keremet-shypaa-chychyrkanak');

-- keremet-chychyrkanak (ru)
UPDATE "product_translations" AS pt SET
  "description" = COALESCE(pt."description", 'Керемет шыпаа — ферментированный напиток из натурального молока. Этот вариант готовится с облепихой. В посте NUSKA_etno сказано: облепиха — источник витамина C, а зерновые продукты могут быть источником витаминов группы B.'),
  "ingredients" = COALESCE(pt."ingredients", 'Натуральное молоко, облепиха (ферментированный напиток). Полный состав — на этикетке бутылки.'),
  "benefits" = COALESCE(pt."benefits", 'Облепиха — источник витамина C (по посту NUSKA_etno)
Зерновые продукты могут быть источником витаминов группы B (по посту NUSKA_etno)
Готовится из натурального молока методом ферментации
Особенность национального вкуса')
FROM "products" AS p WHERE p."id" = pt."product_id" AND pt."locale" = 'ru' AND p."slug" IN ('keremet-shypaa-chychyrkanak');
