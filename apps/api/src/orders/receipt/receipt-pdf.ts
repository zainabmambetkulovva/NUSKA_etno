import PDFDocument from 'pdfkit';

import { Locale } from '../../common/utils/locale';

import { DEJAVU_SANS_B64, DEJAVU_SANS_BOLD_B64 } from './fonts';

/** The parts of the customer's order view that the receipt prints. */
export interface ReceiptOrder {
  orderNumber: number;
  createdAt: Date;
  total: { amount: number };
  customer: { name: string; phone: string };
  delivery: { city: string | null; address: string | null; time: string | null } | null;
  pickup: { name: string | null; address: string | null } | null;
  items: {
    name: string;
    quantity: number;
    unitPrice: { amount: number };
    totalPrice: { amount: number };
  }[];
  payment: { id: string; amount: number; paidAt: Date | null };
}

const TEXT: Record<Locale, Record<string, string>> = {
  ru: {
    title: 'Чек об оплате',
    order: 'Заказ',
    date: 'Дата заказа',
    customer: 'Покупатель',
    item: 'Товар',
    qty: 'Кол-во',
    price: 'Цена',
    sum: 'Сумма',
    total: 'Итого по заказу',
    paid: 'Оплачено',
    paidAt: 'Дата и время оплаты',
    method: 'Способ оплаты',
    methodValue: 'Онлайн, Finik',
    paymentId: 'Номер платежа',
    delivery: 'Доставка',
    deliveryTime: 'Удобное время',
    pickup: 'Самовывоз',
    testNote: 'Тестовая оплата: списана тестовая сумма, сумма заказа указана для информации.',
    thanks: 'Спасибо за покупку! NUSKA_etno — Кыргыздын табигый мурасы',
    som: 'сом',
  },
  ky: {
    title: 'Төлөм чеги',
    order: 'Заказ',
    date: 'Заказ күнү',
    customer: 'Сатып алуучу',
    item: 'Товар',
    qty: 'Саны',
    price: 'Баасы',
    sum: 'Суммасы',
    total: 'Заказдын жыйынтыгы',
    paid: 'Төлөндү',
    paidAt: 'Төлөм күнү жана убактысы',
    method: 'Төлөм ыкмасы',
    methodValue: 'Онлайн, Finik',
    paymentId: 'Төлөмдүн номери',
    delivery: 'Жеткирүү',
    deliveryTime: 'Ыңгайлуу убакыт',
    pickup: 'Өзү алып кетүү',
    testNote: 'Тест төлөмү: тест сумма чегерилди, заказдын суммасы маалымат үчүн.',
    thanks: 'Сатып алганыңыз үчүн рахмат! NUSKA_etno — Кыргыздын табигый мурасы',
    som: 'сом',
  },
};

/** 23500 tyiyn → "235 сом"; fractions only when there are some. */
function money(tyiyn: number, som: string) {
  const value = tyiyn / 100;
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${text.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}\u00a0${som}`;
}

function dateTime(date: Date | null, locale: Locale) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'ky' ? 'ru-RU' : 'ru-RU', {
      timeZone: 'Asia/Bishkek',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/** The receipt of a paid online order as a one-page PDF (A5-wide, Cyrillic font embedded). */
export function renderReceiptPdf(order: ReceiptOrder, locale: Locale): Promise<Buffer> {
  const t = TEXT[locale];
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    info: { Title: `${t.title} №${order.orderNumber}` },
  });
  doc.registerFont('Sans', Buffer.from(DEJAVU_SANS_B64, 'base64'));
  doc.registerFont('Bold', Buffer.from(DEJAVU_SANS_BOLD_B64, 'base64'));
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const W = doc.page.width;
  const left = 48;
  const right = W - 48;
  const GREEN = '#355B3E';
  const GOLD = '#C7A66A';
  const INK = '#2B2A22';
  const MUTED = '#6B6556';

  // header band
  doc.rect(0, 0, W, 96).fill(GREEN);
  doc.rect(0, 96, W, 3).fill(GOLD);
  doc.fillColor('#FAF8EF').font('Bold').fontSize(24).text('NUSKA_etno', left, 30);
  doc.font('Sans').fontSize(12).fillColor('#E8D9BD').text(t.title, left, 62);
  doc
    .font('Bold')
    .fontSize(16)
    .fillColor('#FAF8EF')
    .text(`№ ${order.orderNumber}`, left, 36, { width: right - left, align: 'right' });

  let y = 124;
  const row = (label: string, value: string, bold = false) => {
    doc.font('Sans').fontSize(10).fillColor(MUTED).text(label, left, y, { width: 150 });
    doc
      .font(bold ? 'Bold' : 'Sans')
      .fontSize(10.5)
      .fillColor(INK)
      .text(value, left + 160, y, { width: right - left - 160 });
    y = Math.max(doc.y, y + 14) + 5;
  };

  row(t.date, dateTime(order.createdAt, locale));
  row(t.customer, `${order.customer.name}, ${order.customer.phone}`);
  if (order.delivery)
    row(
      t.delivery,
      [order.delivery.city, order.delivery.address].filter(Boolean).join(', ') +
        (order.delivery.time ? ` (${t.deliveryTime}: ${order.delivery.time})` : '')
    );
  else if (order.pickup)
    row(t.pickup, [order.pickup.name, order.pickup.address].filter(Boolean).join(', '));

  // items
  y += 10;
  doc.rect(left, y, right - left, 22).fill('#F4ECD8');
  doc.font('Bold').fontSize(9.5).fillColor(INK);
  const cQty = right - 220;
  const cPrice = right - 150;
  const cSum = right - 70;
  doc.text(t.item, left + 8, y + 6, { width: cQty - left - 16 });
  doc.text(t.qty, cQty, y + 6, { width: 60, align: 'right' });
  doc.text(t.price, cPrice, y + 6, { width: 70, align: 'right' });
  doc.text(t.sum, cSum, y + 6, { width: 70, align: 'right' });
  y += 30;
  doc.font('Sans').fontSize(10);
  for (const item of order.items) {
    const nameHeight = doc.heightOfString(item.name, { width: cQty - left - 16 });
    doc.fillColor(INK).text(item.name, left + 8, y, { width: cQty - left - 16 });
    doc.text(String(item.quantity), cQty, y, { width: 60, align: 'right' });
    doc.text(money(item.unitPrice.amount, t.som), cPrice - 20, y, { width: 90, align: 'right' });
    doc.text(money(item.totalPrice.amount, t.som), cSum - 20, y, { width: 90, align: 'right' });
    y += Math.max(nameHeight, 14) + 7;
    doc
      .moveTo(left, y - 3)
      .lineTo(right, y - 3)
      .lineWidth(0.5)
      .strokeColor('#E8D9BD')
      .stroke();
  }

  // total
  y += 6;
  doc
    .font('Bold')
    .fontSize(12)
    .fillColor(INK)
    .text(t.total, left + 8, y, { width: 240 });
  doc.text(money(order.total.amount, t.som), right - 190, y, { width: 190, align: 'right' });
  y += 34;

  // payment box
  const boxH = 112;
  doc
    .roundedRect(left, y, right - left, boxH, 8)
    .lineWidth(1)
    .dash(4, { space: 3 })
    .strokeColor(GOLD)
    .stroke()
    .undash();
  doc
    .font('Bold')
    .fontSize(11)
    .fillColor(GREEN)
    .text(`✓ ${t.paid}`, left + 14, y + 12);
  doc
    .fontSize(20)
    .fillColor(INK)
    .text(money(order.payment.amount, t.som), left + 14, y + 10, {
      width: right - left - 28,
      align: 'right',
    });
  let by = y + 44;
  const brow = (label: string, value: string) => {
    doc
      .font('Sans')
      .fontSize(9.5)
      .fillColor(MUTED)
      .text(label, left + 14, by, { width: 160 });
    doc.fillColor(INK).text(value, left + 180, by, { width: right - left - 194 });
    by += 16;
  };
  brow(t.paidAt, dateTime(order.payment.paidAt, locale));
  brow(t.method, t.methodValue);
  brow(t.paymentId, order.payment.id);
  y += boxH + 14;

  if (order.payment.amount !== order.total.amount)
    doc
      .font('Sans')
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(t.testNote, left, y, { width: right - left });

  // footer
  doc
    .font('Sans')
    .fontSize(9)
    .fillColor(MUTED)
    .text(t.thanks, left, doc.page.height - 70, {
      width: right - left,
      align: 'center',
    });
  doc.end();
  return done;
}
