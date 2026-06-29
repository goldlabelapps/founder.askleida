'use client';
import * as React from 'react';
import type { I_PageRouter } from './types';
import { usePathname } from 'next/navigation';
import {
  PractitionerUpdate, 
  Practitioners,
  Dashboard,
  AWINSearch,
  AWIN,
  PractitionerNew,
  Products,
  ListProducts,
  Queue,
  LeidaFlash,
} from '../Leida';

export function PageRouter({ active }: I_PageRouter) {
  const pathname = usePathname();
  const normalizedRoute = (pathname || active || '').trim().replace(/^\/+|\/+$/g, '');
  if (!normalizedRoute) return <Dashboard />;
  if (normalizedRoute === 'practitioners/new') return <PractitionerNew />;
  const practitionerDetailMatch = normalizedRoute.match(/^(practitioners|pracitioners|paractitioners)\/([^/]+)$/);
  if (practitionerDetailMatch) {
    const practitionerId = practitionerDetailMatch[2]?.toLowerCase();
    if (practitionerId === 'new') return <PractitionerNew />;
    return <PractitionerUpdate />;
  }
  if (['practitioners', 'pracitioners', 'paractitioners'].includes(normalizedRoute)) return <Practitioners />;

  switch (normalizedRoute) {
    case 'products/awin':
      return <AWIN />;
    case 'products/awin/search':
      return <AWINSearch />;
    case 'awin':
      return <AWIN />;
    case 'awin/search':
      return <AWINSearch />;
    case 'queue':
    case 'products/queue':
      return <Queue />;
    case 'flash':
      return <LeidaFlash />;
    case 'products':
      return <Products />;
    case 'products/list':
      return <ListProducts />;
    default:
      return <Dashboard />;
  }
}
