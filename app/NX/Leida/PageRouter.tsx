'use client';
import * as React from 'react';
import Awin from './components/Awin/Awin';
import AwinSearch from './components/Awin/components/AwinSearch';
import Claude from './components/Claude/Claude';
import { FounderDash } from './components/FounderDash';
import Supabase from './components/Supabase/Supabase';
import SupabasePostgres from './components/Supabase/components/SupabasePostgres';

interface I_PageRouter {
  active: string | null;
}

export function PageRouter({ active }: I_PageRouter) {
  if (!active) return <FounderDash />;
  switch (active) {
    case 'supabase':
      return <Supabase />;
    case 'supabase/postgres':
      return <SupabasePostgres />;
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
