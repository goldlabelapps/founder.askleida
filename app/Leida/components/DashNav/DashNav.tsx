'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Divider,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { MiniListItem } from '../../../NX/NXAdmin';
import { initAWIN } from '../AWIN/actions/initAWIN';
import { initQueue } from '../Products/actions/initQueue';
import { LoggedInAs } from './components/index';
import { navItems } from './navItems';
import type { DashNavItem } from '../../types.d';

export default function DashNav({
  open = true,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {

  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [queueCount, setQueueCount] = React.useState<number | null>(null);
  const [productCount, setProductCount] = React.useState<number | null>(null);
  const queueCountRequestRef = React.useRef<Promise<void> | null>(null);
  const productCountRequestRef = React.useRef<Promise<void> | null>(null);
  const refreshQueueCount = React.useCallback(async () => {
    if (queueCountRequestRef.current) {
      return queueCountRequestRef.current;
    }

    queueCountRequestRef.current = (async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1',
        status: 'pending',
      });

      const res = await fetch(`/api/products/queue?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `Failed to fetch queue count (${res.status})`);
      }

      setQueueCount(typeof json?.data?.total === 'number' ? json.data.total : 0);
    } catch {
      setQueueCount((current) => current ?? null);
    } finally {
      queueCountRequestRef.current = null;
    }
    })();

    return queueCountRequestRef.current;
  }, []);

  const refreshProductCount = React.useCallback(async () => {
    if (productCountRequestRef.current) {
      return productCountRequestRef.current;
    }

    productCountRequestRef.current = (async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1',
      });

      const res = await fetch(`/api/products?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `Failed to fetch product count (${res.status})`);
      }

      setProductCount(typeof json?.data?.total === 'number' ? json.data.total : 0);
    } catch {
      setProductCount((current) => current ?? null);
    } finally {
      productCountRequestRef.current = null;
    }
    })();

    return productCountRequestRef.current;
  }, []);

  React.useEffect(() => {
    dispatch(initAWIN());
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

  React.useEffect(() => {
    const handleRefresh = () => {
      void refreshQueueCount();
    };

    const handleProductRefresh = () => {
      void refreshProductCount();
    };

    void refreshQueueCount();
    void refreshProductCount();

    const intervalId = window.setInterval(() => {
      void refreshQueueCount();
      void refreshProductCount();
    }, 15000);
    window.addEventListener('leida:queue-count-refresh', handleRefresh);
    window.addEventListener('leida:products-count-refresh', handleProductRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('leida:queue-count-refresh', handleRefresh);
      window.removeEventListener('leida:products-count-refresh', handleProductRefresh);
    };
  }, [refreshProductCount, refreshQueueCount]);

  const renderItem = React.useCallback((item: DashNavItem, nested = false) => (
    <React.Fragment key={item.route}>
      {item.route === '/products/queue' && queueCount === 0 ? null : (
      <MiniListItem
        open={open}
        selected={isRouteActive(item.activeRoutes)}
        onClick={navigateToRoute}
        options={{
          label: item.label,
          icon: item.icon,
          route: item.route,
          nested,
          badgeContent: item.route === '/products/queue'
            ? (typeof queueCount === 'number' && queueCount > 0 ? queueCount : undefined)
            : item.route === '/products/list'
              ? productCount ?? undefined
              : undefined,
        }}
      />
      )}
      {item.children?.map((child) => renderItem(child, true))}
      {!nested ? <Divider /> : null}
    </React.Fragment>
  ), [isRouteActive, navigateToRoute, open, productCount, queueCount]);

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
