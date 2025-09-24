import postersData from './posters.json';

export type Poster = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: 'usd';
  image: string;
  dimensions: string;
  inventoryStatus: 'limited' | 'open-edition';
};

export const posters = postersData as Poster[];

export const getPosterById = (posterId: string) => posters.find((poster) => poster.id === posterId);
