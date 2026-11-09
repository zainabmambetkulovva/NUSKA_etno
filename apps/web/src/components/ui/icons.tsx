import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);
export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9Z" />
  </Icon>
);
export const CartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6" />
    <circle cx="9.5" cy="20" r="1.2" />
    <circle cx="17.5" cy="20" r="1.2" />
  </Icon>
);
export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12 5 5L20 7" />
  </Icon>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);
export const PinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
);
export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
  </Icon>
);
export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20a2 2 0 0 0 4 0" />
  </Icon>
);
export const LeafIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15ZM5 19l7-7" />
  </Icon>
);
export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);
export const BagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2" />
  </Icon>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const GiftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10h16v10H4V10ZM3 7h18v3H3V7ZM12 7v13M12 7S10.5 3 8 3.5 6.5 7 12 7ZM12 7s1.5-4 4-3.5S17.5 7 12 7Z" />
  </Icon>
);
export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 7 8.5-7" />
  </Icon>
);
export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3.5h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2Z" />
  </Icon>
);
/** Line icons of "Why choose us" (drawn larger, thin gold strokes). */
export const SproutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21v-8M12 13c0-5-3.5-8.5-9-8.5 0 5.5 3.5 8.5 9 8.5ZM12 13c0-5 3.5-8.5 9-8.5 0 5.5-3.5 8.5-9 8.5ZM6 8.5l6 4.5M18 8.5 12 13" />
  </Icon>
);
export const QualityIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 2 2.2 1.6 2.7-.2.8 2.6 2.3 1.4-.8 2.6.8 2.6-2.3 1.4-.8 2.6-2.7-.2L12 18l-2.2-1.6-2.7.2-.8-2.6-2.3-1.4.8-2.6-.8-2.6L6.3 6l.8-2.6 2.7.2L12 2Z" />
    <path d="m8.8 10.2 2.2 2.2 4.2-4.2M8 17.5 6.5 22 9.5 21 12 22.5 14.5 21l3 1L16 17.5" />
  </Icon>
);
export const JugIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 3h6M10 3v3c-3 1-5.5 3.5-5.5 7.5S7.5 21 12 21s7.5-3.5 7.5-7.5S17 7 14 6V3" />
    <path d="M7 12.5c1.5-1.5 3 1.5 5 0s3.5 1.5 5 0M8 16c1.3 1 2.7 1 4 0s2.7-1 4 0" />
    <path d="M19 10c1.8 0 2.5 1 2.5 2.3S20.5 15 19 15" />
  </Icon>
);
