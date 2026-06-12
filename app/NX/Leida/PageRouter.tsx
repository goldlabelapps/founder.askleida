'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import Awin from './components/Awin/Awin';
import AwinSearch from './components/Awin/components/AwinSearch';
import Claude from './components/Claude/Claude';
import { FounderDash } from './components/FounderDash';
import { PractitionerUpdate, Practitioners } from './components/Practitioners';
import Supabase from './components/Supabase/Supabase';
import SupabasePostgres from './components/Supabase/components/SupabasePostgres';
import SupabaseUsers from './components/Supabase/components/SupabaseUsers';

interface I_PageRouter {
  active: string | null;
}

export function PageRouter({ active }: I_PageRouter) {
  const pathname = usePathname();
  const normalizedRoute = (pathname || active || '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalizedRoute) return <FounderDash />;

  const practitionerDetailMatch = normalizedRoute.match(/^(practitioners|pracitioners|paractitioners)\/([^/]+)$/);
  if (practitionerDetailMatch) return <PractitionerUpdate />;

  if (['practitioners', 'pracitioners', 'paractitioners'].includes(normalizedRoute)) return <Practitioners />;

  switch (normalizedRoute) {
    case 'supabase':
      return <Supabase />;
    case 'supabase/postgres':
      return <SupabasePostgres />;
    case 'supabase/users':
      return <SupabaseUsers />;
    case 'awin':
      return <Awin />;
    case 'awin/search':
      return <AwinSearch />;
    case 'claude':
      return <Claude />;
    default:
      return <FounderDash />;
  }
}
