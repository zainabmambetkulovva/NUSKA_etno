import type { SiteContent } from '@nuska/types';

/**
 * The company's own contacts (the same values the seed stores). They are used
 * when the admin-managed `contacts` block is empty or the API is not reachable,
 * so the footer never shows an empty "Contacts" column.
 */
const FALLBACK = {
  whatsapp: '+996701111024',
  instagram: 'nuska_etno',
  youtube: 'https://youtube.com/@nuskaetno',
  address: 'Бишкек, Кыргызстан',
} as const;

export interface Contacts {
  phone: string;
  whatsappUrl: string;
  instagram: string;
  instagramUrl: string;
  youtubeUrl: string;
  address: string;
}

/** "996701111024" → "+996 701 111 024". */
export function formatPhone(raw: string) {
  const m = raw.replace(/\D/g, '').match(/^(996)(\d{3})(\d{3})(\d{3})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : raw;
}

export function resolveContacts(content: SiteContent | null): Contacts {
  const value = (key: string) => {
    const v = content?.data?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const whatsapp = value('whatsapp') ?? value('phone') ?? FALLBACK.whatsapp;
  const instagram = (value('instagram') ?? FALLBACK.instagram)
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '');
  const youtube = value('youtube');
  return {
    phone: formatPhone(whatsapp),
    whatsappUrl: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
    instagram,
    instagramUrl: `https://www.instagram.com/${instagram}`,
    youtubeUrl: youtube && /^https:\/\//.test(youtube) ? youtube : FALLBACK.youtube,
    address: value('address') ?? FALLBACK.address,
  };
}
