export const isSoldOut = (available: number | null | undefined) => available != null && available <= 0;

export const formatStockLabel = (
  available: number | null | undefined,
  _initial: number | null | undefined
) => {
  if (available == null) {
    return null;
  }

  if (available <= 0) {
    return 'Sold out';
  }
  
  return `${available} remaining`;
};
