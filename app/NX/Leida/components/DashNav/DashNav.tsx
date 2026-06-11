'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { logout } from '../../../Paywall';
import { ConfirmAction } from '../../../DesignSystem';
import { MiniListItem } from '../../../NXAdmin';

export default function DashNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {

  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [confirmSignOutOpen, setConfirmSignOutOpen] = React.useState(false);

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

    const handleOpenSignOutConfirm = React.useCallback(() => {
      setConfirmSignOutOpen(true);
    }, []);

    const handleCloseSignOutConfirm = React.useCallback(() => {
      setConfirmSignOutOpen(false);
    }, []);

    const handleSignOut = React.useCallback(() => {
      setConfirmSignOutOpen(false);
      dispatch(logout());
      onNavigate?.();
    }, [dispatch, onNavigate]);

  const open = true;
  const normalizedPathname = React.useMemo(() => {
    if (!pathname) return '/';
    if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
    return pathname;
  }, [pathname]);

  const navItems = [
    {
      label: 'Founder',
      icon: 'leida',
      route: '/',
      activeRoutes: ['/'],
    },
    {
      label: 'Supabase',
      icon: 'supabase',
      route: '/supabase',
      activeRoutes: ['/supabase'],
    },
    {
      label: 'Awin',
      icon: 'awin',
      route: '/awin',
      activeRoutes: ['/awin'],
    },
    {
      label: 'Claude',
      icon: 'claude',
      route: '/claude',
      activeRoutes: ['/claude'],
    },
  ];

  const isRouteActive = React.useCallback((activeRoutes?: string[]) => {
    if (!activeRoutes || activeRoutes.length === 0) return false;
    return activeRoutes.some((activeRoute) => {
      if (activeRoute === '/') return normalizedPathname === '/';
      return normalizedPathname === activeRoute || normalizedPathname.startsWith(`${activeRoute}/`);
    });
  }, [normalizedPathname]);

  return (<>
        <Box sx={{ height: 24 }} />
        {navItems.map((item) => (
          <MiniListItem
            key={item.route}
            open={open}
            selected={isRouteActive(item.activeRoutes)}
            onClick={navigateToRoute}
            options={{
              label: item.label,
              icon: item.icon,
              route: item.route,
            }}
          />
        ))}
    {/*
        <MiniListItem
          open={open}
          onClick={navigateToRoute}
          options={{
            label: 'Awin',
            icon: 'awin',
            route: '/awin',
          }}
        />

        
        <MiniListItem
          open={open}
          onClick={navigateToRoute}
          options={{
            label: 'Claude',
            icon: 'claude',
            route: '/claude',
          }}
        /> */}
        <Box sx={{ height: 50 }} />

        <ConfirmAction
          open={confirmSignOutOpen}
          icon="signout"
          title="Sign out?"
          body="This will log you out."
          handleConfirm={handleSignOut}
          handleClose={handleCloseSignOutConfirm}
        />
    </>
  );
}
