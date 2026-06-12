'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';

import {
  Supabase,
  SupabaseUsers,
  SupabasePostgres,
  PractitionerUpdate, 
  Practitioners,
  FounderDash,
  Claude,
  AwinSearch,
  Awin,
  PractitionerNew,
} from '../Leida';

interface I_PageRouter {
  active: string | null;
}

export function PageRouter({ active }: I_PageRouter) {
  const pathname = usePathname();
  const normalizedRoute = (pathname || active || '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalizedRoute) return <FounderDash />;

  if (normalizedRoute === 'practitioners/new') return <PractitionerNew />;

  const practitionerDetailMatch = normalizedRoute.match(/^(practitioners|pracitioners|paractitioners)\/([^/]+)$/);
  if (practitionerDetailMatch) {
    const practitionerId = practitionerDetailMatch[2]?.toLowerCase();
    if (practitionerId === 'new') return <PractitionerNew />;
    return <PractitionerUpdate />;
  }

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
