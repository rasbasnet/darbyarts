import { resolveAssetPath } from '../utils/media';

export type CollectionMeta = {
  id: string;
  title: string;
  years: string;
  statement: string[];
  materialsProcess: string;
  seriesThreads: string;
  acquisitions: string;
  downloadLabel?: string;
  downloadUrl?: string;
};

export const collectionMetadata: CollectionMeta[] = [
  {
    id: 'sugar-coated-apparitions',
    title: 'Sugar-Coated Apparitions',
    years: '2023–2025',
    statement: [
      'This collection consists of ongoing graduate studio work, spanning 2023–2025. Each work is an isolated meditation on perception, performative identity, and abstracted self-portraiture.'
    ],
    materialsProcess:
      'Drawings explore a tight technical refinement with graphite, charcoal, and pastel on gessoed surfaces or bare paper. The result is a surface that feels both clinical and confectionary.',
    seriesThreads:
      'Portals rehearses micro-expressions and the choreography of the mouth—negotiating secrecy, hunger, and the desire to withhold while still offering connection.',
    acquisitions:
      'Originals and select editions are available directly through the studio. Contact for availability or to request additional documentation.'
  },
  {
    id: 'embodied',
    title: 'Embodied',
    years: '2020–2021',
    statement: [
      'Medical illustration has long been used to convey factual information about the body. Embodied reframes that clinical language, arguing for sentiment within sterile diagrams.',
      'Prior to modern imaging, emotions were mapped onto specific organs. These drawings reclaim that history—tracing vulnerability, anxiety, and tenderness through anatomical studies.'
    ],
    materialsProcess:
      'Graphite, charcoal, and colored pencil hover between diagram and confession, applying anatomical accuracy to map emotional narrative.',
    seriesThreads:
      'Each organ system becomes a metaphor for feeling: lungs as breath caught short, hearts stretched between protector and betrayer, nerves pulsing with vigilance.',
    acquisitions:
      'Select works from Embodied are held in private collections. Reach out for provenance details or to request the exhibition essay.',
    downloadLabel: 'Download Embodied exhibition packet',
    downloadUrl: resolveAssetPath('files/BFA Show (20-21) .pdf')
  }
];
