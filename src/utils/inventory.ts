import inventoryConfig from '../data/inventoryConfig.json';

type InventoryOverrides = Record<string, string>;

const overrides: InventoryOverrides = inventoryConfig.overrides ?? {};

export const makeInventoryKey = (posterId: string, editionId?: string | null) => {
  const normalizedPoster = posterId?.trim() ?? '';
  const normalizedEdition = editionId && editionId.trim().length ? editionId.trim() : null;
  return `${normalizedPoster}::${normalizedEdition ?? 'default'}`;
};

export const resolveInventoryKey = (posterId: string, editionId?: string | null) => {
  const key = makeInventoryKey(posterId, editionId);
  return overrides[key] ?? key;
};
