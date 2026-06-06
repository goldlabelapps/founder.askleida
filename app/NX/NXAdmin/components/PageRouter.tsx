'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  MegaDash,
  Account,
  Practitioners,
  Products,
} from '../../NXAdmin';
import PractitionerDetail from './Practitioners/components/PractitionerDetail';

interface I_PageRouter {
  active: string | null;
}

export default function PageRouter({ active }: I_PageRouter) {
    const pathname = usePathname() || '/';
    const segments = pathname.split('/').filter(Boolean);
    const practitionerId = segments[0] === 'practitioners' ? segments[1] : undefined;

    if (!active) return <MegaDash />;
    switch (active) {
      case 'account':
        return <Account />;
      case 'practitioners':
        if (practitionerId) {
          return <PractitionerDetail practitionerId={decodeURIComponent(practitionerId)} />;
        }
        return <Practitioners />;
      case 'products':
        return <Products />;
      default:
        return <MegaDash />;
    }
}
