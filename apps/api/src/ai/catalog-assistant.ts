import type { Locale } from '../common/utils/locale';
import type { ProductCard } from '../products/product.mapper';

import type { AiReply } from './ai.types';
import type { CatalogToolsService, SetPurpose } from './tools/catalog-tools.service';

/**
 * Built-in assistant used while no AI provider is connected (or when it is
 * unavailable). It understands a few intents by keywords and answers only
 * with data from the catalog — it never makes things up.
 */

const T = {
  ru: {
    hello:
      'Здравствуйте! Я помогу подобрать продукты NUSKA_etno: соберу набор для дасторкона или в подарок, подберу продукты на ваш бюджет, покажу цены и расскажу про самовывоз.',
    set: (budget: string | null) =>
      budget
        ? `Вот набор в пределах ${budget} сом по актуальным ценам каталога:`
        : 'Вот набор по актуальным ценам каталога:',
    gift: 'Для подарка подойдут продукты из этого набора:',
    nothingFits: 'К сожалению, на эту сумму не получается собрать набор из продуктов в наличии.',
    found: 'Вот что нашлось в каталоге:',
    notFound:
      'Я не нашёл такого продукта в каталоге. Посмотрите весь ассортимент или спросите иначе.',
    catalog: 'Сейчас в каталоге:',
    pickup: (points: string) =>
      `Заказ оформляется на сайте, затем вы выбираете пункт самовывоза. Статус заказа виден в личном кабинете; когда он станет «Готов к выдаче», приходите за заказом.${points}`,
    pickupPoints: '\n\nПункты самовывоза:\n',
    noPickup: '\n\nПункты самовывоза скоро появятся.',
    order:
      'Чтобы оформить заказ: добавьте продукты в корзину, войдите в аккаунт, выберите пункт самовывоза и подтвердите заказ. Оформить его за вас я не могу — только помочь выбрать.',
    compare:
      'Сравнить продукты я могу только по данным каталога — откройте страницы товаров, там описание и характеристики, которые указала компания.',
    unknown:
      'Я понимаю простые просьбы: «собери дасторкон», «подбери продукты на 1000 сом», «что подарить», «какие продукты есть», «как забрать заказ». Попробуйте одну из них.',
    suggestions: [
      'Помоги собрать дасторкон',
      'Подбери продукты на 1000 сом',
      'Что можно подарить близким?',
      'Как забрать заказ?',
    ],
  },
  ky: {
    hello:
      'Саламатсызбы! NUSKA_etno азыктарын тандоого жардам берем: дасторконго же белекке топтом түзөм, бюджетиңизге жараша азык тандайм, бааларын көрсөтөм жана алып кетүү тууралуу айтып берем.',
    set: (budget: string | null) =>
      budget
        ? `Каталогдун учурдагы баалары боюнча ${budget} сомго чейинки топтом:`
        : 'Каталогдун учурдагы баалары боюнча топтом:',
    gift: 'Белекке бул топтомдогу азыктар ылайыктуу:',
    nothingFits: 'Тилекке каршы, бул суммага бар азыктардан топтом түзүү мүмкүн эмес.',
    found: 'Каталогдон табылгандар:',
    notFound:
      'Мындай азык каталогдон табылган жок. Бардык ассортиментти караңыз же башкача сураңыз.',
    catalog: 'Азыр каталогдо:',
    pickup: (points: string) =>
      `Заказ сайттан берилет, андан кийин алып кетүү жайын тандайсыз. Заказдын абалы жеке кабинетте көрүнөт; «Алып кетүүгө даяр» болгондо келип алыңыз.${points}`,
    pickupPoints: '\n\nАлып кетүү жайлары:\n',
    noPickup: '\n\nАлып кетүү жайлары жакында кошулат.',
    order:
      'Заказ берүү үчүн: азыктарды себетке салып, аккаунтка кириңиз, алып кетүү жайын тандап, заказды ырастаңыз. Заказды сиздин ордуңузга бере албайм — тандоого гана жардам берем.',
    compare:
      'Азыктарды каталогдогу маалымат боюнча гана салыштыра алам — азыктын барагын ачыңыз, ал жерде компания көрсөткөн сүрөттөмө жана мүнөздөмөлөр бар.',
    unknown:
      'Мен жөнөкөй суроолорду түшүнөм: «дасторкон түзүп бер», «1000 сомго азык танда», «эмне белек кылсам болот», «кандай азыктар бар», «заказды кантип алам». Ушулардын бирин байкап көрүңүз.',
    suggestions: [
      'Дасторкон түзүүгө жардам бер',
      '1000 сомго азык танда',
      'Жакындарыма эмне белек кылсам болот?',
      'Заказды кантип алам?',
    ],
  },
};

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

/** "1000 сом", "на 1 500", "1000с" → 1000 (only plausible budgets). */
export function parseBudget(text: string): number | null {
  const match = /(\d[\d\s]{0,6}\d|\d{2,})\s*(сом|som|с\b|c\b)?/iu.exec(text);
  if (!match) return null;
  const value = Number(match[1].replace(/\s/g, ''));
  return value >= 50 && value <= 1_000_000 ? value : null;
}

export async function catalogAssistant(
  question: string,
  locale: Locale,
  tools: CatalogToolsService
): Promise<AiReply> {
  const t = T[locale];
  const text = question.toLocaleLowerCase();
  const reply = (r: Partial<AiReply> & { reply: string }): AiReply => ({
    mode: 'catalog',
    products: [],
    proposal: null,
    suggestions: t.suggestions,
    ...r,
  });

  if (has(text, ['привет', 'здравств', 'салам', 'кандайсыз', 'добрый'])) {
    return reply({ reply: t.hello });
  }

  const budget = parseBudget(text);
  const wantsGift = has(text, ['подар', 'белек', 'сыйлык']);
  const wantsSet =
    wantsGift ||
    budget !== null ||
    has(text, [
      'дасторкон',
      'дастаркон',
      'дастархан',
      'набор',
      'топтом',
      'собери',
      'түз',
      'подбери',
      'танда',
    ]);

  if (wantsSet) {
    const purpose: SetPurpose = wantsGift ? 'gift' : 'dastorkon';
    const set = await tools.buildSet(budget, purpose, locale);
    if (set.items.length === 0) return reply({ reply: t.nothingFits });
    return reply({
      reply: wantsGift ? t.gift : t.set(budget === null ? null : String(budget)),
      proposal: set,
    });
  }

  if (
    has(text, [
      'самовывоз',
      'забрать',
      'забер',
      'получить заказ',
      'пункт',
      'алып кет',
      'кайдан ал',
      'кантип ал',
      'заказды ал',
      'адрес',
    ])
  ) {
    const points = await tools.pickup();
    const list = points.length
      ? t.pickupPoints +
        points
          .map((p) => `• ${p.name} — ${p.address}${p.openingHours ? ` (${p.openingHours})` : ''}`)
          .join('\n')
      : t.noPickup;
    return reply({ reply: t.pickup(list) });
  }

  if (has(text, ['оформ', 'заказ бер', 'как заказ', 'кантип заказ', 'оплат', 'төлө'])) {
    return reply({ reply: t.order });
  }

  if (has(text, ['разниц', 'отлич', 'айырма', 'сравн', 'салышт'])) {
    const found = await tools.search(question, locale, 4);
    return reply({ reply: t.compare, products: found });
  }

  if (
    has(text, [
      'каталог',
      'какие',
      'что есть',
      'ассортимент',
      'кандай',
      'бардык',
      'эмне бар',
      'список',
      'тизме',
    ])
  ) {
    const all = await tools.allProducts(locale);
    return reply({ reply: t.catalog, products: all.slice(0, 12) });
  }

  const found: ProductCard[] = await tools.search(question, locale, 6);
  if (found.length > 0) return reply({ reply: t.found, products: found });
  return reply({ reply: t.unknown });
}
