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
    activeRoutes: ['/products', '/products/manage', '/products/awin', '/awin', '/products/queue', '/products/list'],
    children: [
      // {
      //   label: 'AWIN',
      //   icon: 'awin',
      //   route: '/products/awin',
      //   activeRoutes: ['/products/awin', '/awin'],
      // },
      {
        label: 'Queue',
        icon: 'queue',
        route: '/products/queue',
        activeRoutes: ['/products/queue'],
      },
      {
        label: 'Manage',
        icon: 'manage',
        route: '/products/manage',
        activeRoutes: ['/products/manage'],
      },
    ],
  }
];
