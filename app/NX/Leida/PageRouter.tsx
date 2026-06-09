'use client';
import * as React from 'react';
import Awin from './components/Awin/Awin';
import { FounderDash } from './components/FounderDash';
import Supabase from './components/Supabase/Supabase';

interface I_PageRouter {
  active: string | null;
}

export function PageRouter({ active }: I_PageRouter) {
  if (!active) return <FounderDash />;
  switch (active) {
    case 'supabase':
      return <Supabase />;
    case 'awin':
      return <Awin />;
    default:
      return <FounderDash />;
  }
}
