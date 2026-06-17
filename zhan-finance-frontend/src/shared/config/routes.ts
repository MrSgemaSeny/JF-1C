export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  SERVICES: '/services',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
