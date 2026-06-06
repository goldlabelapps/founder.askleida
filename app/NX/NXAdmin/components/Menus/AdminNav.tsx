'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
} from '@mui/material';
import { MiniListItem } from '../../../NXAdmin';

export default function AdminNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {

  const router = useRouter();
  const pathname = usePathname();

  const buildAdminPath = (route?: string) => {
    if (!route) return '/';
    const slug = route.replace(/^\/+/, '');
    return `/${slug}`;
  };

  const navigateToRoute = React.useCallback((route?: string) => {
      const nextPath = buildAdminPath(route);
      if (pathname !== nextPath) {
          router.push(nextPath);
      }
      onNavigate?.();
  }, [onNavigate, pathname, router]);

  const open = true;

  return (<>
        <Box sx={{ height: 24 }} />
        <MiniListItem
            open={open}
            onClick={navigateToRoute}
            options={{
              label: 'Dashboard',
              icon: 'dashboard',
              route: '/',
            }}
        />

        <MiniListItem
          open={open}
          onClick={navigateToRoute}
          options={{
            label: 'Account',
            icon: 'account',
            route: '/account',
          }}
        />

        <MiniListItem
          open={open}
          onClick={navigateToRoute}
          options={{
            label: 'Practitioners',
            icon: 'visitor',
            route: '/practitioners',
          }}
        />

        <MiniListItem
          open={open}
          onClick={navigateToRoute}
          options={{
            label: 'Products',
            icon: 'products',
            route: '/products',
          }}
        />

        <Box sx={{ height: 50 }} />
    </>
  );
}
