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
    label: 'Practitioners',
    icon: 'practitioner',
    route: '/practitioners',
    activeRoutes: ['/practitioners'],
  },
  {
    label: 'Products',
    icon: 'products',
    route: '/products',
    activeRoutes: ['/products'],
  },
  {
    label: 'Flash',
    icon: 'flash',
    route: '/flash',
    activeRoutes: ['/flash'],
  }
];
