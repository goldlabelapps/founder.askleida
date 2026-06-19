export type DashNavItem = {
  label: string;
  icon: string;
  route: string;
  activeRoutes: string[];
};

export const navItems: DashNavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/',
    activeRoutes: ['/'],
  },

  {
    label: 'Awin',
    icon: 'awin',
    route: '/awin',
    activeRoutes: ['/awin'],
  },
  {
    label: 'Products',
    icon: 'products',
    route: '/products',
    activeRoutes: ['/products'],
  },
  {
    label: 'Practitioners',
    icon: 'practitioner',
    route: '/practitioners',
    activeRoutes: ['/practitioners'],
  },
];
