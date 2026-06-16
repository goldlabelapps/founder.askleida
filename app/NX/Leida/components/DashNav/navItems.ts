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
  // {
  //   label: 'New',
  //   icon: 'practitioner',
  //   route: '/practitioners/new',
  //   activeRoutes: ['/practitioners/new'],
  // },
  {
    label: 'Products',
    icon: 'products',
    route: '/products',
    activeRoutes: ['/products'],
  },
//   {
//     label: 'Awin',
//     icon: 'awin',
//     route: '/awin',
//     activeRoutes: ['/awin'],
//   },
//   {
//     label: 'Claude',
//     icon: 'claude',
//     route: '/claude',
//     activeRoutes: ['/claude'],
//   },
];
