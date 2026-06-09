'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  FounderDash,
  Supabase,
} from '../../Leida';

interface I_PageRouter {
  active: string | null;
}

export default function PageRouter({ active }: I_PageRouter) {
  // const pathname = usePathname() || '/';
  // const segments = pathname.split('/').filter(Boolean);
    
  if (!active) return <FounderDash />;
    switch (active) {
      case 'supabase':
        return <Supabase />;
      default:
        return <FounderDash />;
    }
}
