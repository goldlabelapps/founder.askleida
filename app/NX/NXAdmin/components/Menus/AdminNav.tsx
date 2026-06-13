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

export default function AdminNav({
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
            label: 'Awin',
            icon: 'awin',
            route: '/awin',
          }}
        />


        <MiniListItem
          open={open}
          onClick={navigateToRoute}
          options={{
            label: 'Supabase',
            icon: 'supabase',
            route: '/supabase',
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
        />
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
