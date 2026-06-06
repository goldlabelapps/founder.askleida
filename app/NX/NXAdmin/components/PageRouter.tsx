'use client';
import * as React from 'react';
import {
  MegaDash,
  Account,
} from '../../NXAdmin';

interface I_PageRouter {
  active: string | null;
}

export default function PageRouter({ active }: I_PageRouter) {
    if (!active) return <MegaDash />;
    switch (active) {
      case 'account':
        return <Account />;
      default:
        return <MegaDash />;
    }
}
