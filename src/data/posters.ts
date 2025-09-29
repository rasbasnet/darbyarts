import postersData from './posters.json';

export type PosterEdition = {
  id: string;
  label: string;
  priceCents: number;
  description?: string;
  details?: string[];
};

export type Poster = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: 'usd';
  image: string;
  dimensions: string;
  inventoryStatus: 'limited' | 'open-edition';
  maxQuantityPerOrder?: number;
  isAvailable?: boolean;
  releaseInfo?: string;
  editions?: PosterEdition[];
};

export const posters = postersData as Poster[];

export const getPosterById = (posterId: string) => posters.find((poster) => poster.id === posterId);
