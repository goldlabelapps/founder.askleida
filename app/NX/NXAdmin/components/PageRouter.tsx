'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Awin,
  AwinSearch,
  FounderDash,
} from '../../../Leida';

export const NAV_ROUTES = new Set([
  'account',
  'practitioners',
  'products',
  'awin',
  'awin/search',
]);

export const sanitizePath = (value: string) => {
  if (!value) return '/';
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return normalized.replace(/\/+$/, '') || '/';
};

export const getActiveFromPathname = (pathname: string) => {
  const normalized = sanitizePath(pathname);
  if (normalized === '/') return null;
  if (normalized === '/awin/search' || normalized.startsWith('/awin/search/')) {
    return 'awin/search';
  }
  const [segment] = normalized.slice(1).split('/');
  if (!segment) return null;
  try {
    const decoded = decodeURIComponent(segment);
    return NAV_ROUTES.has(decoded) ? decoded : null;
  } catch {
    return NAV_ROUTES.has(segment) ? segment : null;
  }
};

interface I_PageRouter {
  active: string | null;
}

export default function PageRouter({ active }: I_PageRouter) {
  const pathname = usePathname() || '/';
  const normalizedPath = sanitizePath(pathname);
  const isAwinSearch = normalizedPath === '/awin/search' || normalizedPath.startsWith('/awin/search/');
    
  if (!active) return <FounderDash />;
    switch (active) {
      case 'awin':
        return isAwinSearch ? <AwinSearch /> : <Awin />;
      case 'awin/search':
        return <AwinSearch />;
      default:
        return <FounderDash />;
    }
}
