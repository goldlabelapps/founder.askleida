import type { DashNavItem } from '../../types.d';

export const navItems: DashNavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/',
    activeRoutes: ['/'],
  },
  {
    label: 'Practitioners',
    icon: 'practitioner',
    route: '/practitioners',
    activeRoutes: ['/practitioners'],
  },
  {
    label: 'Products',
    icon: 'products',
    route: '/products',
    activeRoutes: ['/products', '/awin', '/products/queue', '/products/list'],
    children: [
      {
        label: 'Queue',
        icon: 'queue',
        route: '/products/queue',
        activeRoutes: ['/products/queue'],
      },
      {
        label: 'Leida Products',
        icon: 'leida',
        route: '/products/list',
        activeRoutes: ['/products/list'],
      },
      {
        label: 'Awin',
        icon: 'awin',
        route: '/awin',
        activeRoutes: ['/awin'],
      },
      
    ],
  }
];
