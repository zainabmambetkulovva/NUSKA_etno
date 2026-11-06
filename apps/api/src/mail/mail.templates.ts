import { Locale } from '../common/utils/locale';

// Kyrgyz texts must be reviewed by an editor before production.

export interface MailContent {
  subject: string;
  text: string;
}

export function emailVerificationMail(locale: Locale, link: string): MailContent {
  if (locale === 'ky') {
    return {
      subject: 'Электрондук почтаны ырастоо — NUSKA_etno',
      text: `Саламатсызбы!\n\nЭлектрондук почтаңызды ырастоо үчүн шилтемеге өтүңүз:\n${link}\n\nШилтеме 24 саат жарактуу.`,
    };
  }
  return {
    subject: 'Подтверждение email — NUSKA_etno',
    text: `Здравствуйте!\n\nЧтобы подтвердить адрес электронной почты, перейдите по ссылке:\n${link}\n\nСсылка действует 24 часа.`,
  };
}

export function passwordResetMail(locale: Locale, link: string): MailContent {
  if (locale === 'ky') {
    return {
      subject: 'Сырсөздү калыбына келтирүү — NUSKA_etno',
      text: `Сиз сырсөздү калыбына келтирүүнү сурадыңыз.\n\nЖаңы сырсөз коюу үчүн шилтемеге өтүңүз:\n${link}\n\nШилтеме 1 саат жарактуу. Эгер сиз сураган эмес болсоңуз, бул катка көңүл бурбаңыз.`,
    };
  }
  return {
    subject: 'Восстановление пароля — NUSKA_etno',
    text: `Вы запросили восстановление пароля.\n\nЧтобы задать новый пароль, перейдите по ссылке:\n${link}\n\nСсылка действует 1 час. Если вы не запрашивали восстановление, просто проигнорируйте это письмо.`,
  };
}

export function newsletterConfirmMail(locale: Locale, link: string): MailContent {
  if (locale === 'ky') {
    return {
      subject: 'Жазылууну ырастаңыз — NUSKA_etno',
      text: `Саламатсызбы!\n\nNUSKA_etno жаңылыктарына жазылууну ырастоо үчүн шилтемеге өтүңүз:\n${link}\n\nШилтеме 7 күн жарактуу. Эгер сиз жазылган эмес болсоңуз, бул катка көңүл бурбаңыз.`,
    };
  }
  return {
    subject: 'Подтвердите подписку — NUSKA_etno',
    text: `Здравствуйте!\n\nЧтобы подтвердить подписку на новости NUSKA_etno, перейдите по ссылке:\n${link}\n\nСсылка действует 7 дней. Если вы не подписывались, просто проигнорируйте это письмо.`,
  };
}
