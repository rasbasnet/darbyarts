import rawArtworks from './artworks.json';

type Orientation = 'portrait' | 'landscape';

type RawArtwork = {
  id: string;
  title: string;
  year: string;
  created: string;
  medium: string;
  size: string;
  image: string;
  alt: string;
  orientation: Orientation;
  series?: string;
  statement?: string;
  palette: {
    primary: string;
    secondary: string;
  };
};

export type Artwork = RawArtwork;

const parseDate = (value: string) => new Date(value).getTime();

export const artworks: Artwork[] = [...(rawArtworks as RawArtwork[])].sort(
  (a, b) => parseDate(b.created) - parseDate(a.created),
);

export const artworkMap: Record<string, Artwork> = artworks.reduce<Record<string, Artwork>>(
  (accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  },
  {},
);

export const getArtworkById = (id: string) => artworkMap[id];
