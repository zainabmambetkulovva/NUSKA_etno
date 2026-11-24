'use client';

import type { ReactNode } from 'react';

import { usePathname } from 'next/navigation';

/**
 * The public site's header, footer, assistant and "back to top" button are
 * not shown in the admin panel: it has its own menu and works like an app.
 * The children are rendered on the server and only shown or hidden here.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (/^\/(ky|ru)\/admin(\/|$)/.test(pathname)) return null;
  return <>{children}</>;
}
