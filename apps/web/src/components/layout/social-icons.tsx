import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { viewBox: '0 0 24 24', width: 22, height: 22, 'aria-hidden': true } as const;

export const InstagramIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const TelegramIcon = (p: P) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M21.4 4.3 2.9 11.4c-1 .4-1 1.6.1 1.9l4.6 1.4 1.8 5.5c.2.7 1.1.9 1.6.4l2.6-2.4 4.8 3.5c.6.4 1.4.1 1.6-.6l3.3-15.4c.2-.9-.7-1.6-1.9-1.4ZM9.6 14.4l8.2-7.2-6.6 8.4-.3 3-1.3-4.2Z" />
  </svg>
);
export const WhatsAppIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" {...p}>
    <path d="M4 20l1.2-4.1A8.5 8.5 0 1 1 8.4 19L4 20Z" />
    <path
      d="M9.2 8.3c.2-.4.6-.4.8 0l.7 1.5c.1.3 0 .6-.2.8l-.4.4c.5 1.1 1.4 2 2.6 2.6l.4-.4c.2-.2.5-.3.8-.2l1.5.7c.4.2.4.6 0 .8-.9.8-2 1-3.2.4a8 8 0 0 1-3.6-3.6c-.6-1.2-.3-2.3.6-3Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);
export const YouTubeIcon = (p: P) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
  </svg>
);
