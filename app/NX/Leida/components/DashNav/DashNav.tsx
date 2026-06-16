'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Divider,
} from '@mui/material';
import { navItems } from '../../../Leida';
import { MiniListItem } from '../../../NXAdmin';
import { LoggedInAs } from './components/index';

export default function DashNav({
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

  return (<>
        <Box sx={{ height: 24 }} />
        {navItems.map((item) => (
          <React.Fragment key={item.route}>
            <MiniListItem
              open={open}
              selected={isRouteActive(item.activeRoutes)}
              onClick={navigateToRoute}
              options={{
                label: item.label,
                icon: item.icon,
                route: item.route,
              }}
            />
            <Divider />
          </React.Fragment>
        ))}
    
        <Box sx={{ my: 2 }}>
          <LoggedInAs onNavigate={onNavigate} />
        </Box>
    </>
  );
}
