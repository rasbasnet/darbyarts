export type Exhibition = {
  id: string;
  title: string;
  venue: string;
  location: string;
  year: string;
  type: 'Solo' | 'Group' | 'Residency' | 'Juried';
  notes?: string;
  slug: string;
  heroArtworkId?: string;
};

export const exhibitions: Exhibition[] = [
  {
    id: '2025-contrast',
    slug: 'contrast-thornback',
    title: 'CONTRAST: A Juried Exhibition',
    venue: 'Thornback Gallery',
    location: 'Greenville, SC',
    year: '2025',
    type: 'Juried',
    heroArtworkId: 'eat-me',
    notes: 'Featuring the drawing “Eat Me” investigating performative appetite and vulnerability.'
  },
  {
    id: '2023-penland',
    slug: 'penland-scholarship',
    title: 'Penland School of Craft Scholarship Residency',
    venue: 'Penland School of Craft',
    location: 'Spruce Pine, NC',
    year: '2023',
    type: 'Residency',
    notes: 'Scholarship-supported intensive that catalysed the pastel and graphite investigations present in current work.'
  },
  {
    id: '2021-embodied',
    slug: 'embodied-bfa',
    title: 'Embodied: An Anatomical Exploration of Inner Narrative',
    venue: 'S. Tucker Cooke Gallery',
    location: 'Asheville, NC',
    year: '2021',
    type: 'Solo',
    heroArtworkId: 'drainage',
    notes: 'BFA exhibition examining medical illustration as a site for emotional storytelling.'
  }
];
