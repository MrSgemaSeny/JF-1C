export interface Service {
  id: string;
  titleKey: string;
  descKey: string;
  priceKey: string;
  featuresKeys: string[];
  bulletsKeys?: string[];
  link?: string;
  image?: string;
}

/** Used on the Homepage services preview widget */
export const mockServices: Service[] = [
  {
    id: '1',
    titleKey: 'landing:services.mock.0.title',
    descKey: 'landing:services.mock.0.desc',
    priceKey: 'landing:services.mock.0.price',
    featuresKeys: ['landing:services.mock.0.f0', 'landing:services.mock.0.f1', 'landing:services.mock.0.f2', 'landing:services.mock.0.f3'],
  },
  {
    id: '2',
    titleKey: 'landing:services.mock.1.title',
    descKey: 'landing:services.mock.1.desc',
    priceKey: 'landing:services.mock.1.price',
    featuresKeys: ['landing:services.mock.1.f0', 'landing:services.mock.1.f1', 'landing:services.mock.1.f2', 'landing:services.mock.1.f3'],
  },
  {
    id: '3',
    titleKey: 'landing:services.mock.2.title',
    descKey: 'landing:services.mock.2.desc',
    priceKey: 'landing:services.mock.2.price',
    featuresKeys: ['landing:services.mock.2.f0', 'landing:services.mock.2.f1', 'landing:services.mock.2.f2'],
  },
];

/** Full services list for the Services page */
export const servicesList: Service[] = [
  {
    id: 's1',
    titleKey: 'landing:services.list.0.title',
    descKey: 'landing:services.list.0.desc',
    priceKey: 'landing:services.list.0.price',
    featuresKeys: [],
    bulletsKeys: ['landing:services.list.0.b0', 'landing:services.list.0.b1', 'landing:services.list.0.b2'],
    link: '/services#solution',
    image: '',
  },
  {
    id: 's2',
    titleKey: 'landing:services.list.1.title',
    descKey: 'landing:services.list.1.desc',
    priceKey: 'landing:services.list.1.price',
    featuresKeys: [],
    bulletsKeys: ['landing:services.list.1.b0', 'landing:services.list.1.b1', 'landing:services.list.1.b2'],
    link: '/services#solution',
    image: '',
  },
  {
    id: 's3',
    titleKey: 'landing:services.list.2.title',
    descKey: 'landing:services.list.2.desc',
    priceKey: 'landing:services.list.2.price',
    featuresKeys: [],
    bulletsKeys: ['landing:services.list.2.b0', 'landing:services.list.2.b1', 'landing:services.list.2.b2'],
    link: '/services#solution',
    image: '',
  },
  {
    id: 's4',
    titleKey: 'landing:services.list.3.title',
    descKey: 'landing:services.list.3.desc',
    priceKey: 'landing:services.list.3.price',
    featuresKeys: [],
    bulletsKeys: ['landing:services.list.3.b0', 'landing:services.list.3.b1', 'landing:services.list.3.b2'],
    link: '/services#solution',
    image: '',
  },
  {
    id: 's5',
    titleKey: 'landing:services.list.4.title',
    descKey: 'landing:services.list.4.desc',
    priceKey: 'landing:services.list.4.price',
    featuresKeys: [],
    bulletsKeys: ['landing:services.list.4.b0', 'landing:services.list.4.b1', 'landing:services.list.4.b2'],
    link: '/services#solution',
    image: '',
  },
  {
    id: 's6',
    titleKey: 'landing:services.list.5.title',
    descKey: 'landing:services.list.5.desc',
    priceKey: 'landing:services.list.5.price',
    featuresKeys: [],
    bulletsKeys: ['landing:services.list.5.b0', 'landing:services.list.5.b1', 'landing:services.list.5.b2'],
    link: '/services#solution',
    image: '',
  },
];
