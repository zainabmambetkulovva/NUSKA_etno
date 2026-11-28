/**
 * Texts of the Telegram messages sent to the shop about orders (HTML mode).
 * Kept free of Nest and Prisma so they can be tested on their own.
 */

export interface OrderForMessage {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  deliveryCity: string | null;
  deliveryAddress: string | null;
  deliveryTime: string | null;
  pickupLocationName: string | null;
  paymentMethod: 'CASH' | 'ONLINE';
  customerComment: string | null;
  totalAmount: number;
  items: { productName: string; quantity: number; totalPriceAmount: number }[];
}

/** Telegram HTML: only &, < and > must be escaped (and quotes inside attributes). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 12345 tyiyn → "123,45 сом"; whole som without decimals; thousands separated by a space. */
export function formatSom(tyiyn: number): string {
  const som = tyiyn / 100;
  const text = som
    .toFixed(Number.isInteger(som) ? 0 : 2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${text} сом`;
}

/** "+996555123456" → "+996 555 123 456". */
export function prettyPhone(e164: string): string {
  const m = /^\+996(\d{3})(\d{3})(\d{3})$/.exec(e164);
  return m ? `+996 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

export const orderNo = (n: number) => `№${String(n).padStart(5, '0')}`;

const adminLink = (adminUrl: string) =>
  `\n\n<a href="${escapeHtml(adminUrl)}">Админкада ачуу →</a>`;

export function newOrderMessage(order: OrderForMessage, adminUrl: string): string {
  const e = escapeHtml;
  const lines: string[] = [`🛒 <b>Жаңы буйрутма ${orderNo(order.orderNumber)}</b>`, ''];
  const digits = order.customerPhone.replace(/\D/g, '');
  lines.push(`👤 ${e(order.customerName)}`);
  lines.push(
    `📞 ${e(prettyPhone(order.customerPhone))} · <a href="https://wa.me/${digits}">WhatsApp</a>`
  );
  if (order.customerEmail) lines.push(`✉️ ${e(order.customerEmail)}`);
  lines.push('');
  if (order.deliveryMethod === 'DELIVERY') {
    const where = [order.deliveryCity, order.deliveryAddress].filter(Boolean).join(', ');
    lines.push(`🚚 Жеткирүү: ${e(where)}`);
    if (order.deliveryTime) lines.push(`🕒 Ыңгайлуу убакыт: ${e(order.deliveryTime)}`);
  } else {
    lines.push(`🏪 Өзү алып кетүү: ${e(order.pickupLocationName ?? '—')}`);
  }
  lines.push('', '📦 Азыктар:');
  for (const item of order.items) {
    lines.push(`• ${e(item.productName)} × ${item.quantity} — ${formatSom(item.totalPriceAmount)}`);
  }
  lines.push(
    `<b>Жалпы: ${formatSom(order.totalAmount)}</b>${order.deliveryMethod === 'DELIVERY' ? ' (жеткирүүсүз)' : ''}`
  );
  lines.push(
    order.paymentMethod === 'ONLINE'
      ? '💳 Төлөм: онлайн (Finik) — төлөм күтүлүүдө'
      : '💵 Төлөм: алганда (накталай же которуу)'
  );
  if (order.customerComment) lines.push(`💬 ${e(order.customerComment)}`);
  return lines.join('\n') + adminLink(adminUrl);
}

export function paidMessage(
  order: Pick<OrderForMessage, 'orderNumber' | 'customerName'>,
  amount: number,
  adminUrl: string
): string {
  return (
    `✅ <b>Буйрутма ${orderNo(order.orderNumber)} төлөндү</b> (Finik)\n` +
    `Сумма: ${formatSom(amount)}\n👤 ${escapeHtml(order.customerName)}` +
    adminLink(adminUrl)
  );
}

export function cancelledMessage(
  order: Pick<OrderForMessage, 'orderNumber' | 'customerName' | 'customerPhone'>,
  adminUrl: string
): string {
  return (
    `❌ <b>Буйрутма ${orderNo(order.orderNumber)} жокко чыгарылды</b>\n` +
    `Кардар өзү жокко чыгарды.\n👤 ${escapeHtml(order.customerName)} · 📞 ${escapeHtml(prettyPhone(order.customerPhone))}` +
    adminLink(adminUrl)
  );
}

export const TEST_MESSAGE =
  '🔔 <b>NUSKA_etno</b>: текшерүү билдирүүсү. Жаңы буйрутмалар ушул чатка келет.';
export const CONNECTED_MESSAGE =
  '✅ <b>NUSKA_etno</b>: бул чат туташтырылды. Жаңы буйрутмалар, төлөмдөр жана жокко чыгаруулар ушул жерге келет.';
