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
  maxQuantityPerEdition?: number;
  isAvailable?: boolean;
  releaseInfo?: string;
  editions?: PosterEdition[];
};

const parsedTestPrice = (() => {
  const raw = process.env.REACT_APP_POSTER_TEST_PRICE_CENTS;
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
})();

const applyTestPrice = (poster: Poster): Poster => {
  if (!parsedTestPrice) {
    return poster;
  }

  const nextPoster: Poster = {
    ...poster,
    priceCents: parsedTestPrice
  };

  if (!poster.editions?.length) {
    return nextPoster;
  }

  return {
    ...nextPoster,
    editions: poster.editions.map((edition) => ({
      ...edition,
      priceCents: parsedTestPrice
    }))
  };
};

export const posters = (postersData as Poster[]).map(applyTestPrice);

export const getPosterById = (posterId: string) => posters.find((poster) => poster.id === posterId);
