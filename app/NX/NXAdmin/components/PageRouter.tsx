'use client';
import * as React from 'react';
import {
  MegaDash,
  Tenants,
} from '../../NXAdmin';

interface I_PageRouter {
  active: string | null;
}

export default function PageRouter({ active }: I_PageRouter) {
    if (!active) return <MegaDash />;
    switch (active) {
      case 'tenants':
        return <Tenants />;
      default:
        return <MegaDash />;
    }
}
