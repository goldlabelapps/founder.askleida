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
    activeRoutes: ['/products', '/awin'],
    children: [
      {
        label: 'Awin',
        icon: 'awin',
        route: '/awin',
        activeRoutes: ['/awin'],
      },
      {
        label: 'Queue',
        icon: 'queue',
        route: '/products/queue',
        activeRoutes: ['/products/queue'],
      },
    ],
  }
];
