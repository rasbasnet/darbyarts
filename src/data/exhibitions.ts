export type Exhibition = {
  id: string;
  title: string;
  venue: string;
  location: string;
  year: string;
  type: 'Solo' | 'Group' | 'Residency' | 'Fair';
  notes?: string;
  link?: string;
};

export const exhibitions: Exhibition[] = [
  {
    id: '2025-flux',
    title: 'FLUX: Bodies in Bloom',
    venue: 'Cobalt Gallery',
    location: 'Portland, OR',
    year: '2025',
    type: 'Solo',
    notes: 'Upcoming—large-scale graphite and pastel works exploring voice and appetite.'
  },
  {
    id: '2024-surface-study',
    title: 'Surface Study',
    venue: 'Glass Box Contemporary',
    location: 'Seattle, WA',
    year: '2024',
    type: 'Group',
    notes: 'Curated by Mei Chen alongside works by Giulia Bianchi and Malik Rios.'
  },
  {
    id: '2023-crave',
    title: 'Crave',
    venue: 'Studio 4A',
    location: 'Chicago, IL',
    year: '2023',
    type: 'Solo'
  },
  {
    id: '2023-behind-the-teeth',
    title: 'Behind the Teeth',
    venue: 'The Drawing Room',
    location: 'Brooklyn, NY',
    year: '2023',
    type: 'Group',
    notes: 'An investigation of hunger politics with works by diaspora artists.'
  },
  {
    id: '2022-sound-residency',
    title: 'Residency: Sound House',
    venue: 'Sound House Residency',
    location: 'Taos, NM',
    year: '2022',
    type: 'Residency'
  },
  {
    id: '2021-ink-fair',
    title: 'INK Contemporary Drawing Fair',
    venue: 'Pier 24',
    location: 'San Francisco, CA',
    year: '2021',
    type: 'Fair'
  }
];
