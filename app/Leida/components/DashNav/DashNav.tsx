'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Divider,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { MiniListItem } from '../../../NX/NXAdmin';
import { useLeidaBus } from '../../hooks/useLeida';
import { initQueue } from '../Products/actions/initQueue';
import { LoggedInAs } from './components/index';
import { navItems, type DashNavItem } from './navItems';

export default function DashNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {

  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const queueBus = useLeidaBus('/api/products/queue');

  React.useEffect(() => {
    dispatch(initQueue());
  }, [dispatch]);

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
  const normalizedPathname = React.useMemo(() => {
    if (!pathname) return '/';
    if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
    return pathname;
  }, [pathname]);

  const isRouteActive = React.useCallback((activeRoutes?: string[]) => {
    if (!activeRoutes || activeRoutes.length === 0) return false;
    return activeRoutes.some((activeRoute) => {
      if (activeRoute === '/') return normalizedPathname === '/';
      return normalizedPathname === activeRoute || normalizedPathname.startsWith(`${activeRoute}/`);
    });
  }, [normalizedPathname]);

  const queueCount = React.useMemo(() => {
    if (!Array.isArray(queueBus?.data)) return 0;
    return queueBus.data.length;
  }, [queueBus?.data]);

  const renderItem = React.useCallback((item: DashNavItem, nested = false) => (
    <React.Fragment key={item.route}>
      <MiniListItem
        open={open}
        selected={isRouteActive(item.activeRoutes)}
        onClick={navigateToRoute}
        options={{
          label: item.label,
          icon: item.icon,
          route: item.route,
          nested,
          badgeContent: item.route === '/products/queue' ? queueCount : undefined,
        }}
      />
      {item.children?.map((child) => renderItem(child, true))}
      {!nested ? <Divider /> : null}
    </React.Fragment>
  ), [isRouteActive, navigateToRoute, open, queueCount]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: 24 }} />
      {navItems.map((item) => renderItem(item))}

      <Box sx={{ mt: 'auto', mb: 2 }}>
        <LoggedInAs onNavigate={onNavigate} />
      </Box>
    </Box>
  );
}
