'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

/**
 * Header, assistant and «back to top» button are shown everywhere except the
 * admin panel (it has its own menu and works like an app). The footer
 * (`homeOnly`) is part of the home page only: the other pages end without it.
 * The children are rendered on the server and only shown or hidden here.
 */
export function SiteChrome({
  children,
  homeOnly = false,
}: {
  children: ReactNode;
  homeOnly?: boolean;
}) {
  const pathname = usePathname();
  if (/^\/(ky|ru)\/admin(\/|$)/.test(pathname)) return null;
  if (homeOnly && !/^\/(ky|ru)\/?$/.test(pathname)) return null;
  return <>{children}</>;
}
