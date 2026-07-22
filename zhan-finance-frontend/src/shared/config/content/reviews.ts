export interface Review {
  id: number;
  nameKey: string;
  companyKey: string;
  textKey: string;
}

export const reviewsList: Review[] = [
  {
    id: 1,
    nameKey: 'landing:reviews.0.name',
    companyKey: 'landing:reviews.0.company',
    textKey: 'landing:reviews.0.text',
  },
  {
    id: 2,
    nameKey: 'landing:reviews.1.name',
    companyKey: 'landing:reviews.1.company',
    textKey: 'landing:reviews.1.text',
  },
  {
    id: 3,
    nameKey: 'landing:reviews.2.name',
    companyKey: 'landing:reviews.2.company',
    textKey: 'landing:reviews.2.text',
  },
];
