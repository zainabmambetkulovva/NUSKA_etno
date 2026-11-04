import { NotificationType, OrderStatus } from '@prisma/client';

import { Locale } from '../common/utils/locale';

// Kyrgyz texts must be reviewed by an editor before production.

interface Template {
  type: NotificationType;
  title: Record<Locale, (n: string) => string>;
  message: Record<Locale, (address: string) => string>;
}

const TEMPLATES: Record<OrderStatus, Template> = {
  PENDING: {
    type: NotificationType.ORDER_CREATED,
    title: { ru: (n) => `Заказ №${n} оформлен`, ky: (n) => `№${n} буйрутма кабыл алынды` },
    message: {
      ru: () => 'Мы получили ваш заказ и сообщим, когда он будет подтверждён.',
      ky: () => 'Буйрутмаңызды алдык. Ал ырасталганда кабарлайбыз.',
    },
  },
  CONFIRMED: {
    type: NotificationType.ORDER_CONFIRMED,
    title: { ru: (n) => `Заказ №${n} подтверждён`, ky: (n) => `№${n} буйрутма ырасталды` },
    message: {
      ru: () => 'Ваш заказ подтверждён и скоро начнёт собираться.',
      ky: () => 'Буйрутмаңыз ырасталды жана жакында даярдала баштайт.',
    },
  },
  PREPARING: {
    type: NotificationType.GENERAL,
    title: { ru: (n) => `Заказ №${n} собирается`, ky: (n) => `№${n} буйрутма даярдалууда` },
    message: {
      ru: () => 'Мы начали собирать ваш заказ.',
      ky: () => 'Буйрутмаңызды даярдай баштадык.',
    },
  },
  READY_FOR_PICKUP: {
    type: NotificationType.ORDER_READY,
    title: {
      ru: (n) => `Заказ №${n} готов к выдаче`,
      ky: (n) => `№${n} буйрутма алып кетүүгө даяр`,
    },
    message: {
      ru: (address) => `Заказ ждёт вас в пункте самовывоза: ${address}.`,
      ky: (address) => `Буйрутмаңыз алып кетүү жайында күтүп турат: ${address}.`,
    },
  },
  COMPLETED: {
    type: NotificationType.ORDER_COMPLETED,
    title: { ru: (n) => `Заказ №${n} выдан`, ky: (n) => `№${n} буйрутма берилди` },
    message: { ru: () => 'Спасибо за покупку!', ky: () => 'Сатып алганыңыз үчүн рахмат!' },
  },
  CANCELLED: {
    type: NotificationType.ORDER_CANCELLED,
    title: { ru: (n) => `Заказ №${n} отменён`, ky: (n) => `№${n} буйрутма жокко чыгарылды` },
    message: { ru: () => 'Ваш заказ отменён.', ky: () => 'Буйрутмаңыз жокко чыгарылды.' },
  },
};

export function orderNotification(
  status: OrderStatus,
  locale: Locale,
  orderNumber: number,
  address: string
) {
  const template = TEMPLATES[status];
  return {
    type: template.type,
    title: template.title[locale](String(orderNumber)),
    message: template.message[locale](address),
  };
}
