'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Awin,
  AwinSearch,
  Claude,
  FounderDash,
  Supabase,
  SupabasePostgres,
  SupabaseUsers,
} from '../../../Leida';

export const NAV_ROUTES = new Set([
  'account',
  'practitioners',
  'products',
  'supabase',
  'supabase/postgres',
  'supabase/users',
  'awin',
  'awin/search',
  'claude',
]);

export const sanitizePath = (value: string) => {
  if (!value) return '/';
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return normalized.replace(/\/+$/, '') || '/';
};

export const getActiveFromPathname = (pathname: string) => {
  const normalized = sanitizePath(pathname);
  if (normalized === '/') return null;
  if (normalized === '/supabase/postgres' || normalized.startsWith('/supabase/postgres/')) {
    return 'supabase/postgres';
  }
  if (normalized === '/supabase/users' || normalized.startsWith('/supabase/users/')) {
    return 'supabase/users';
  }
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
  const isSupabasePostgres = normalizedPath === '/supabase/postgres' || normalizedPath.startsWith('/supabase/postgres/');
  const isSupabaseUsers = normalizedPath === '/supabase/users' || normalizedPath.startsWith('/supabase/users/');
  const isAwinSearch = normalizedPath === '/awin/search' || normalizedPath.startsWith('/awin/search/');
    
  if (!active) return <FounderDash />;
    switch (active) {
      case 'supabase':
        return isSupabasePostgres ? <SupabasePostgres /> : isSupabaseUsers ? <SupabaseUsers /> : <Supabase />;
      case 'supabase/users':
        return <SupabaseUsers />;
      case 'awin':
        return isAwinSearch ? <AwinSearch /> : <Awin />;
      case 'awin/search':
        return <AwinSearch />;
      case 'claude':
        return <Claude />;
      default:
        return <FounderDash />;
    }
}
