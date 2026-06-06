'use client';
import * as React from 'react';
import {
  MegaDash,
  Account,
  Practitioners,
  Products,
} from '../../NXAdmin';

interface I_PageRouter {
  active: string | null;
}

export default function PageRouter({ active }: I_PageRouter) {
    if (!active) return <MegaDash />;
    switch (active) {
      case 'account':
        return <Account />;
      case 'practitioners':
        return <Practitioners />;
      case 'products':
        return <Products />;
      default:
        return <MegaDash />;
    }
}
