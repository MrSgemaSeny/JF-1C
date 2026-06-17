export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  bullets?: string[];
  link?: string;
  image?: string;
}
