import { exhibitions } from './exhibitions';

export type ExhibitionDetail = {
  slug: string;
  title: string;
  venue: string;
  location: string;
  year: string;
  type: string;
  heroArtworkId?: string;
  summary: string;
  body: string[];
  pullQuote?: string;
};

const details: ExhibitionDetail[] = [
  {
    slug: 'contrast-thornback',
    title: 'CONTRAST: A Juried Exhibition',
    venue: 'Thornback Gallery',
    location: 'Greenville, SC',
    year: '2025',
    type: 'Juried',
    heroArtworkId: 'eat-me',
    summary:
      'Eat Me anchors this juried presentation, pairing confectionary colour with a dare to engage the artist’s body-as-vessel.',
    body: [
      'Created within a broader investigation of performative identity, Eat Me began as a meditation on vulnerability. Over the course of its making, it shifted into something bolder—daring, almost vindictive—trapping the viewer with unwavering eye contact and an impossible invitation.',
      'Sugary cereal, a polished spoon, and a limitless pink void cloak the discomfort in sweetness. The drawing imagines how performance can weaponise politeness while still craving connection.',
      'The physical work combines coloured pencil, layers of gesso, and even expired makeup to push cosmetic colour into the fibres of the paper—mirroring the way social masks blur onto skin.'
    ],
    pullQuote:
      'How better to engage with the bitter discomfort of social performance than by cloaking it in pink and making it sweeter?'
  },
  {
    slug: 'penland-scholarship',
    title: 'Penland School of Craft Scholarship Residency',
    venue: 'Penland School of Craft',
    location: 'Spruce Pine, NC',
    year: '2023',
    type: 'Residency',
    summary:
      'An immersive scholarship residency that rekindled material play and set the stage for the Portals drawings.',
    body: [
      'Awarded the Iredell Statesville Arts Education Scholarship, Darby spent a concentrated session at Penland reinvestigating drawing as performance. The residency encouraged experimentation with cosmetics, powdered pigments, and unconventional surfaces.',
      'Summer Self-Portrait no. 1 and no. 2 were completed during this residency, anchoring the experience in daily graphite study and the stamina of observation.',
      'Time at Penland provided the through-line between early anatomical works and the current candy-coated portraits—offering space to return to form while embracing new materials.'
    ]
  },
  {
    slug: 'embodied-bfa',
    title: 'Embodied: An Anatomical Exploration of Inner Narrative',
    venue: 'S. Tucker Cooke Gallery',
    location: 'Asheville, NC',
    year: '2021',
    type: 'Solo',
    heroArtworkId: 'drainage',
    summary:
      'BFA thesis exhibition reframing medical illustration as emotional storytelling—each organ a metaphor for feeling.',
    body: [
      'Prior to modern medical imaging, emotions were often mapped onto specific organs. Embodied reclaims that history, using anatomical drawing as a vessel for narrative.',
      'The project argues for conceptual meaning within clinical illustration, giving sentiment to what is typically sterile. Graphite renderings of hearts, lungs, and nerves become case studies for vulnerability.',
      'Large-scale works such as Drainage and Extraction literalise the weight of feeling—showing how tenderness and fear move through the body.'
    ],
    pullQuote:
      'This series recontextualises science to explore sentiment—the literal embodiment of feeling.'
  }
];

const detailMap = new Map(details.map((detail) => [detail.slug, detail]));

export const getExhibitionDetail = (slug: string) => detailMap.get(slug);

export const exhibitionsWithDetails = exhibitions.map((exhibition) => ({
  ...exhibition,
  detail: detailMap.get(exhibition.slug)
}));
